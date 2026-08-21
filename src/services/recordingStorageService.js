/**
 * recordingStorageService.js
 * 
 * Production-ready IndexedDB storage service for full-length meeting recordings.
 * Supports large video Blobs, cryptographic SHA-256 calculation, and cross-session persistence.
 */

const DB_NAME = 'SamvaadEvidenceDB';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

/**
 * Open or initialize the IndexedDB database.
 */
export const initRecordingsDB = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('meetingId', 'meetingId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('sha256Hash', 'sha256Hash', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
};

/**
 * Detect the best supported video MIME type for MediaRecorder in the current browser.
 */
export const getSupportedMimeType = () => {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return 'video/webm';
  }

  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'video/webm';
};

/**
 * Calculate the SHA-256 cryptographic hash of a Blob using the browser's Web Crypto API.
 */
export const calculateBlobSha256 = async (blob) => {
  if (!blob || !(blob instanceof Blob)) {
    throw new Error('Invalid Blob provided for SHA-256 hashing');
  }

  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Save a complete recording with binary Blob and metadata into IndexedDB.
 */
export const saveRecordingBlob = async (recording) => {
  const db = await initRecordingsDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record = {
      id: recording.id || recording.recordingId,
      recordingId: recording.recordingId || recording.id,
      meetingId: recording.meetingId || 'UNKNOWN',
      meetingTitle: recording.meetingTitle || 'AICTE Meeting Recording',
      institute: recording.institute || '',
      hostId: recording.hostId || 'host',
      hostName: recording.hostName || 'Host',
      participants: recording.participants || [],
      startTime: recording.startTime || new Date().toISOString(),
      endTime: recording.endTime || new Date().toISOString(),
      duration: typeof recording.duration === 'number' ? recording.duration : 0,
      mimeType: recording.mimeType || 'video/webm',
      blob: recording.blob, // Native IndexedDB storage of Blob
      fileSize: recording.blob?.size || recording.fileSize || 0,
      sha256Hash: recording.sha256Hash || '',
      integrityStatus: recording.integrityStatus || 'verified',
      status: recording.status || 'processed',
      createdAt: recording.createdAt || new Date().toISOString(),
    };

    const request = store.put(record);

    request.onsuccess = () => resolve(record);
    request.onerror = () => reject(request.error || new Error('Failed to save recording to IndexedDB'));
  });
};

/**
 * Retrieve a recording (including Blob) by its recording ID or id.
 */
export const getRecordingBlob = async (id) => {
  const db = await initRecordingsDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error('Failed to fetch recording from IndexedDB'));
  });
};

/**
 * Get all recordings from IndexedDB, sorted newest to oldest.
 */
export const getAllRecordings = async () => {
  try {
    const db = await initRecordingsDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result || [];
        records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        resolve(records);
      };
      request.onerror = () => reject(request.error || new Error('Failed to list recordings from IndexedDB'));
    });
  } catch (err) {
    console.warn('[recordingStorageService] IndexedDB not available:', err.message);
    return [];
  }
};

/**
 * Delete a recording from IndexedDB.
 */
export const deleteRecordingBlob = async (id) => {
  const db = await initRecordingsDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error || new Error('Failed to delete recording from IndexedDB'));
  });
};
