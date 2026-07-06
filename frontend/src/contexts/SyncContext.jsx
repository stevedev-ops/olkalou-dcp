import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';

const SyncContext = createContext(null);
const QUEUE_KEY = 'dcp_offline_queue';

export function getOfflineQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
  catch { return []; }
}

export function SyncProvider({ children }) {
  const [offlineCount, setOfflineCount] = useState(() => getOfflineQueue().length);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const syncOfflineQueue = useCallback(async () => {
    const queue = getOfflineQueue();
    if (!queue.length || isSyncing || !navigator.onLine) return;
    
    setIsSyncing(true);
    let successCount = 0;
    const failed = [];
    
    for (const payload of queue) {
      // Simulate slight delay to prevent hammering backend
      await new Promise(r => setTimeout(r, 500));
      
      const { data, error } = await api.register(payload, payload.invite_token);
      if (!error && data && !data.offline) {
        successCount++;
      } else {
        failed.push(payload);
      }
    }

    if (failed.length === 0) {
      localStorage.removeItem(QUEUE_KEY);
    } else {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
    }
    
    setOfflineCount(failed.length);
    setIsSyncing(false);
    
    if (successCount > 0) {
      toast.success(`✅ Synced ${successCount} offline recruit${successCount !== 1 ? 's' : ''} to HQ!`);
    }
  }, [isSyncing]);

  // Handle adding an item to the queue globally
  const enqueueOffline = useCallback((payload) => {
    const queue = getOfflineQueue();
    queue.push({ ...payload, _queued_at: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    setOfflineCount(queue.length);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check just in case the browser was online when loaded with queue
    if (navigator.onLine && offlineCount > 0) {
       syncOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineQueue, offlineCount]);

  return (
    <SyncContext.Provider value={{ offlineCount, isSyncing, isOnline, syncOfflineQueue, enqueueOffline }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
