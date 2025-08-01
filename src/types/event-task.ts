import { Guest } from './guest';
import { VipGuest } from './vip-guest';

export type GuestTask = {
  guest_id: string;
  task_name: string;
  is_completed: boolean;
  updated_at?: string;
  updated_by?: string;
};

export type GuestTaskHistory = {
  id: string;
  guest_id: string;
  task_name: string;
  is_completed: boolean;
  updated_at: string;
  updated_by?: string;
};

// A generic guest type for the event tasks page
export type TaskGuest = (Guest | VipGuest) & {
  tasks: GuestTask[];
  image_url?: string;
  secondaryInfo?: string;
};