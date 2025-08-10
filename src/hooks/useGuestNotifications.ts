import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GuestNotification } from '@/types/notification';

const useGuestNotifications = (guestId: string | null) => {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (guestId) {
      try {
        const storedIds = localStorage.getItem(`read_notifications_${guestId}`);
        if (storedIds) {
          setReadIds(new Set(JSON.parse(storedIds)));
        }
      } catch (error) {
        console.error("Failed to parse read notifications from localStorage", error);
        setReadIds(new Set());
      }
    }
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

  const markAllAsRead = () => {
    if (!guestId) return;
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem(`read_notifications_${guestId}`, JSON.stringify(Array.from(allIds)));
    } catch (error) {
      console.error("Failed to save read notifications to localStorage", error);
    }
  };

  return {
    notifications,
    isLoading,
    unreadCount,
    markAllAsRead,
  };
};

export default useGuestNotifications;