-- Add profile_status to vip_guests
ALTER TABLE public.vip_guests
ADD COLUMN IF NOT EXISTS profile_status TEXT NOT NULL DEFAULT 'Trống';

-- Add profile_status to guests
ALTER TABLE public.guests
ADD COLUMN IF NOT EXISTS profile_status TEXT NOT NULL DEFAULT 'Trống';