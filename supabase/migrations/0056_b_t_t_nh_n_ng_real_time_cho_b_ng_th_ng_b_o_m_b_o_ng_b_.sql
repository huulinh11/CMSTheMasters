-- This ensures that changes to the notifications table are broadcasted in real-time.
alter publication supabase_realtime add table public.guest_notifications;