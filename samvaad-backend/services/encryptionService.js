import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Get the MASTER encryption key from environment variable.
 * Key must be 32 bytes (64 hex characters).
 * This key is ONLY used to wrap/unwrap meeting-specific keys, or decrypt legacy messages.
 */
const getMasterKey = () => {
    const keyHex = process.env.CHAT_MASTER_KEY;
    if (!keyHex || keyHex.length !== 64) {
        throw new Error('CHAT_MASTER_KEY must be set to a 64-character hex string (32 bytes)');
    }
    return Buffer.from(keyHex, 'hex');
};

/**
 * Generate a new cryptographically random 32-byte AES-256 key for a meeting.
 * @returns {string} 64-character hex string
 */
export const generateMeetingKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Wrap (encrypt) a meeting key using the MASTER key.
 * @param {string} meetingKeyHex - The raw 32-byte meeting key
 * @returns {{ encryptedChatKey: string, chatKeyIv: string, chatKeyAuthTag: string }}
 */
export const wrapMeetingKey = (meetingKeyHex) => {
    if (!meetingKeyHex) throw new Error('Missing meeting key to wrap');
    const masterKey = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv, { authTagLength: AUTH_TAG_LENGTH });

    let encrypted = cipher.update(meetingKeyHex, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
        encryptedChatKey: encrypted,
        chatKeyIv: iv.toString('hex'),
        chatKeyAuthTag: authTag
    };
};

/**
 * Unwrap (decrypt) a meeting key using the MASTER key.
 * @param {string} encryptedChatKey 
 * @param {string} chatKeyIv 
 * @param {string} chatKeyAuthTag 
 * @returns {string} The raw 32-byte meeting key (hex string)
 */
export const unwrapMeetingKey = (encryptedChatKey, chatKeyIv, chatKeyAuthTag) => {
    if (!encryptedChatKey || !chatKeyIv || !chatKeyAuthTag) {
        throw new Error('Missing key wrapping material');
    }
    const masterKey = getMasterKey();
    const iv = Buffer.from(chatKeyIv, 'hex');
    const authTag = Buffer.from(chatKeyAuthTag, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedChatKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

/**
 * Encrypt a plaintext message using a specific meeting key.
 * @param {string} plaintext - The message to encrypt
 * @param {string} meetingKeyHex - The raw meeting key
 * @returns {{ encryptedContent: string, iv: string, authTag: string }}
 */
export const encryptMessage = (plaintext, meetingKeyHex) => {
    if (!plaintext) return { encryptedContent: null, iv: null, authTag: null };
    if (!meetingKeyHex) throw new Error('Meeting key is required to encrypt message');

    const key = Buffer.from(meetingKeyHex, 'hex');
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
        encryptedContent: encrypted,
        iv: iv.toString('hex'),
        authTag
    };
};

/**
 * Decrypt an AES-256-GCM encrypted message.
 * @param {string} encryptedContent - Hex-encoded ciphertext
 * @param {string} ivHex - Hex-encoded initialization vector
 * @param {string} authTagHex - Hex-encoded authentication tag
 * @param {string|null} meetingKeyHex - The meeting key (null for legacy master-key decryption)
 * @returns {string} Decrypted plaintext
 */
export const decryptMessage = (encryptedContent, ivHex, authTagHex, meetingKeyHex = null) => {
    if (!encryptedContent || !ivHex || !authTagHex) return null;

    try {
        // Use meeting key if provided (new), otherwise fall back to Master Key (legacy)
        const key = meetingKeyHex ? Buffer.from(meetingKeyHex, 'hex') : getMasterKey();
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.error('[EncryptionService] Decryption failed:', err.message);
        return '[Decryption Failed]';
    }
};

/**
 * Compute SHA-256 hash of a buffer (for file integrity).
 * @param {Buffer} buffer - File buffer
 * @returns {string} Hex-encoded SHA-256 hash
 */
export const hashFile = (buffer) => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Compute SHA-256 hash of a string.
 * @param {string} data - String data to hash
 * @returns {string} Hex-encoded SHA-256 hash
 */
export const hashString = (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};
