import api from '../api/axios';

/**
 * AICTE Samvaad — Client-Side End-to-End Encryption (E2EE) Service
 * Powered by browser-native Web Crypto API (crypto.subtle) & IndexedDB
 * 
 * SECURITY BOUNDARIES:
 * - ECDH P-256 Keypair generated client-side.
 * - Private key stored STRICTLY in browser IndexedDB (never leaves the device).
 * - Public key registered on MongoDB User profile (SPKI Hex format).
 * - Shared AES-256-GCM conversation keys derived via ECDH key agreement.
 * - Server ONLY sees encrypted ciphertext, IV, and Auth Tag. Server CANNOT decrypt direct chat messages.
 */

const DB_NAME = 'samvaad_e2ee_db';
const DB_VERSION = 1;
const STORE_KEYS = 'identity_keys';

// In-memory cache for derived shared AES keys (userId -> CryptoKey)
const sharedKeyCache = new Map();

// Helper: Open IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_KEYS)) {
        db.createObjectStore(STORE_KEYS);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Helper: Buffer <-> Hex
const buf2hex = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
const hex2buf = (hex) => new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))).buffer;

// 1. Get or Create Client-Side ECDH Key Pair
export const initUserKeyPair = async (currentUser) => {
  if (!currentUser?._id || typeof window === 'undefined' || !window.crypto?.subtle) {
    return null;
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_KEYS, 'readonly');
    const store = tx.objectStore(STORE_KEYS);
    
    const storedKeyPair = await new Promise((resolve) => {
      const req = store.get(`keypair_${currentUser._id}`);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });

    if (storedKeyPair?.privateKey && storedKeyPair?.publicKeyHex) {
      // Key pair exists locally, verify backend has our public key
      if (!currentUser.publicKey || currentUser.publicKey !== storedKeyPair.publicKeyHex) {
        await api.put('/users/public-key', { publicKey: storedKeyPair.publicKeyHex });
      }
      return storedKeyPair;
    }

    // Generate new ECDH P-256 key pair
    const keyPair = await window.crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true, // extractable public key
      ['deriveKey', 'deriveBits']
    );

    // Export public key as SPKI hex string
    const spkiBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyHex = buf2hex(spkiBuffer);

    // Save in IndexedDB
    const writeTx = db.transaction(STORE_KEYS, 'readwrite');
    const writeStore = writeTx.objectStore(STORE_KEYS);
    writeStore.put({ privateKey: keyPair.privateKey, publicKeyHex }, `keypair_${currentUser._id}`);

    // Register public key on backend
    await api.put('/users/public-key', { publicKey: publicKeyHex });

    return { privateKey: keyPair.privateKey, publicKeyHex };
  } catch (err) {
    console.error('[E2EE] Key pair init error:', err);
    return null;
  }
};

// 2. Get Local Private Key
const getLocalPrivateKey = async (userId) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_KEYS, 'readonly');
    const store = tx.objectStore(STORE_KEYS);
    const result = await new Promise((resolve) => {
      const req = store.get(`keypair_${userId}`);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
    return result?.privateKey || null;
  } catch {
    return null;
  }
};

// 3. Derive Shared AES-256-GCM Key with Target User via ECDH
export const getSharedConversationKey = async (currentUserId, targetUserId) => {
  const cacheKey = `${currentUserId}:${targetUserId}`;
  if (sharedKeyCache.has(cacheKey)) {
    return sharedKeyCache.get(cacheKey);
  }

  try {
    const localPrivateKey = await getLocalPrivateKey(currentUserId);
    if (!localPrivateKey) return null;

    // Fetch target user's public key
    const res = await api.get(`/users/${targetUserId}/public-key`);
    const targetPublicKeyHex = res.data?.publicKey;
    if (!targetPublicKeyHex) {
      console.warn(`[E2EE] Target user ${targetUserId} has no registered E2EE public key`);
      return null;
    }

    // Import target public key
    const targetPublicKeyBuffer = hex2buf(targetPublicKeyHex);
    const targetPublicKey = await window.crypto.subtle.importKey(
      'spki',
      targetPublicKeyBuffer,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      []
    );

    // Perform ECDH key agreement to derive shared AES-GCM 256-bit key
    const sharedKey = await window.crypto.subtle.deriveKey(
      { name: 'ECDH', public: targetPublicKey },
      localPrivateKey,
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable
      ['encrypt', 'decrypt']
    );

    sharedKeyCache.set(cacheKey, sharedKey);
    return sharedKey;
  } catch (err) {
    console.error('[E2EE] Shared key derivation error:', err);
    return null;
  }
};

// 4. Encrypt Direct Message Payload
export const encryptDirectMessagePayload = async (plaintext, currentUserId, targetUserId) => {
  if (!plaintext || !currentUserId || !targetUserId) return null;

  try {
    const sharedKey = await getSharedConversationKey(currentUserId, targetUserId);
    if (!sharedKey) return null;

    // Generate random 12-byte IV for AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedText = encoder.encode(plaintext);

    const ciphertextWithTag = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      encodedText
    );

    const fullArray = new Uint8Array(ciphertextWithTag);
    // GCM appends 16-byte authentication tag to ciphertext
    const ciphertextBytes = fullArray.slice(0, fullArray.length - 16);
    const authTagBytes = fullArray.slice(fullArray.length - 16);

    return {
      text: '[Encrypted Direct Message]',
      encryptedContent: buf2hex(ciphertextBytes),
      iv: buf2hex(iv),
      authTag: buf2hex(authTagBytes),
      isE2EE: true
    };
  } catch (err) {
    console.error('[E2EE] Encrypt payload error:', err);
    return null;
  }
};

// 5. Decrypt Direct Message Payload
export const decryptDirectMessagePayload = async (message, currentUserId, otherUserId) => {
  if (!message || !message.encryptedContent || !message.iv || !message.authTag) {
    return message?.text || '';
  }

  try {
    const sharedKey = await getSharedConversationKey(currentUserId, otherUserId);
    if (!sharedKey) return '[Encryption Key Unavailable]';

    const ciphertextBuffer = hex2buf(message.encryptedContent);
    const authTagBuffer = hex2buf(message.authTag);
    const ivBuffer = hex2buf(message.iv);

    // Reconstruct Web Crypto AES-GCM input (ciphertext + authTag)
    const combined = new Uint8Array(ciphertextBuffer.byteLength + authTagBuffer.byteLength);
    combined.set(new Uint8Array(ciphertextBuffer), 0);
    combined.set(new Uint8Array(authTagBuffer), ciphertextBuffer.byteLength);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
      sharedKey,
      combined.buffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.error('[E2EE] Decrypt payload error:', err);
    return '[Decryption Error]';
  }
};
