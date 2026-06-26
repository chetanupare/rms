import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

const OfflineContext = createContext(null);

const DB_NAME = 'slcg-offline';
const STORE_NAME = 'queue';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function addToQueue(operation, url, payload) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({ operation, url, payload, createdAt: new Date().toISOString(), retries: 0 });
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function getQueue() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const items = tx.objectStore(STORE_NAME).getAll();
    tx.oncomplete = () => { db.close(); resolve(items.result || []); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function removeFromQueue(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const processingRef = useRef(false);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current || !navigator.onLine) return;
    processingRef.current = true;
    try {
      const items = await getQueue();
      for (const item of items) {
        try {
          if (item.operation === 'POST') {
            await api.post(item.url, item.payload);
          } else if (item.operation === 'PUT') {
            await api.put(item.url, item.payload);
          } else if (item.operation === 'DELETE') {
            await api.delete(item.url);
          }
          await removeFromQueue(item.id);
        } catch {
          if (item.retries >= 3) {
            await removeFromQueue(item.id);
          } else {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put({ ...item, retries: item.retries + 1 });
            await new Promise((r) => { tx.oncomplete = () => { db.close(); r(); }; });
          }
        }
      }
    } finally {
      processingRef.current = false;
      const remaining = await getQueue();
      setQueueCount(remaining.length);
    }
  }, []);

  useEffect(() => {
    if (isOnline) processQueue();
    const interval = setInterval(processQueue, 5000);
    return () => clearInterval(interval);
  }, [isOnline, processQueue]);

  useEffect(() => {
    getQueue().then((items) => setQueueCount(items.length));
  }, []);

  async function offlinePost(url, payload) {
    await addToQueue('POST', url, payload);
    setQueueCount((c) => c + 1);
  }

  async function offlinePut(url, payload) {
    await addToQueue('PUT', url, payload);
    setQueueCount((c) => c + 1);
  }

  async function offlineDelete(url) {
    await addToQueue('DELETE', url, null);
    setQueueCount((c) => c + 1);
  }

  return (
    <OfflineContext.Provider value={{ isOnline, queueCount, offlinePost, offlinePut, offlineDelete }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) return { isOnline: true, queueCount: 0, offlinePost: async () => {}, offlinePut: async () => {}, offlineDelete: async () => {} };
  return ctx;
}
