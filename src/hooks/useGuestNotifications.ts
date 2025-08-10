import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GuestNotification } from '@/types/notification';

// --- Module-level store for sharing state between hook instances ---
const readIdsStores: { [guestId: string]: Set<string> } = {};
const listeners: { [guestId: string]: Set<React.Dispatch<React.SetStateAction<Set<string>>>> } = {};

const updateLocalStorage = (guestId: string, newReadIds: Set<string>) => {
  try {
    localStorage.setItem(`read_notifications_${guestId}`, JSON.stringify(Array.from(newReadIds)));
  } catch (error) {
    console.error("Failed to save read notifications to localStorage", error);
  }
};

const notifyListeners = (guestId: string) => {
  listeners[guestId]?.forEach(listener => {
    // We pass a new Set to ensure React detects a state change
    listener(new Set(readIdsStores[guestId]));
  });
};

const useGuestNotifications = (guestId: string | null) => {
  // Initialize state from the store or localStorage
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (!guestId) return new Set();
    if (!readIdsStores[guestId]) {
      try {
        const storedIds = localStorage.getItem(`read_notifications_${guestId}`);
        readIdsStores[guestId] = storedIds ? new Set(JSON.parse(storedIds)) : new Set();
      } catch {
        readIdsStores[guestId] = new Set();
      }
    }
    return readIdsStores[guestId];
  });

  // Subscribe to the store on mount
  useEffect(() => {
    if (!guestId) return;

    if (!listeners[guestId]) {
      listeners[guestId] = new Set();
    }
    listeners[guestId].add(setReadIds);

    // Unsubscribe on unmount
    return () => {
      if (guestId && listeners[guestId]) {
        listeners[guestId].delete(setReadIds);
      }
    };
  }, [guestId]);

  const { data: notifications = [], isLoading } = useQuery<GuestNotification[]>({
    queryKey: ['guest_notifications', guestId],
    queryFn: async () => {
      if (!guestId) return [];
      const { data, error } = await supabase
        .from('guest_notifications')
        .select('*')
        .or(`guest_id.eq.${guestId},guest_id.eq.all`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!guestId,
  });

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !readIds.has(n.id)).length;
  }, [notifications, readIds]);

  const markOneAsRead = (notificationId: string) => {
    if (!guestId || readIdsStores[guestId]?.has(notificationId)) return;

    const newReadIds = new Set(readIdsStores[guestId]);
    newReadIds.add(notificationId);
    readIdsStores[guestId] = newReadIds;
    
    updateLocalStorage(guestId, newReadIds);
    notifyListeners(guestId);
  };

  const markAllAsRead = () => {
    if (!guestId) return;
    const allIds = new Set(notifications.map(n => n.id));
    readIdsStores[guestId] = allIds;
    
    updateLocalStorage(guestId, allIds);
    notifyListeners(guestId);
  };

  return {
    notifications,
    isLoading,
    unreadCount,
    readIds,
    markOneAsRead,
    markAllAsRead,
  };
};

export default useGuestNotifications;