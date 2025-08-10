export type GuestNotification = {
  id: string;
  guest_id: string;
  content: string;
  type: 'task' | 'benefit' | 'timeline';
  created_at: string;
};