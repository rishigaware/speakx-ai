// IndexedDB-based Audio Storage Service
// Handles persistent local storage of binary audio blobs without size limits

const DB_NAME = 'speakxai_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'saved_audios';

const generateCacheKey = (text, engine, voice, model) => {
  return `${engine || ''}::${voice || ''}::${model || ''}::${(text || '').trim().toLowerCase()}`;
};

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('cacheKey', 'cacheKey', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Save an audio blob to IndexedDB
 */
export const saveAudioToStorage = async ({ text, engine, voice, voiceName, model, blob, duration }) => {
  try {
    const db = await openDB();
    const cacheKey = generateCacheKey(text, engine, voice, model);
    const id = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const record = {
      id,
      text: text.trim(),
      engine,
      voice,
      voiceName: voiceName || voice || 'Default Voice',
      model: model || '',
      blob,
      duration: duration || null,
      createdAt: Date.now(),
      cacheKey
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);

      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save audio to storage:', err);
    throw err;
  }
};

/**
 * Fetch all stored audios, newest first
 */
export const getAllStoredAudios = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('createdAt');
      const req = index.openCursor(null, 'prev');
      const results = [];

      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to retrieve stored audios:', err);
    return [];
  }
};

/**
 * Find cached audio matching exact text and engine parameters
 */
export const findCachedAudio = async ({ text, engine, voice, model }) => {
  try {
    const db = await openDB();
    const cacheKey = generateCacheKey(text, engine, voice, model);

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('cacheKey');
      const req = index.get(cacheKey);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to check audio cache:', err);
    return null;
  }
};

/**
 * Delete a specific stored audio by ID
 */
export const deleteStoredAudio = async (id) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to delete audio from storage:', err);
    throw err;
  }
};

/**
 * Delete all stored audios
 */
export const clearAllStoredAudios = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to clear stored audios:', err);
    throw err;
  }
};
