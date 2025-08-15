-- Add zns_sent column to guests table
ALTER TABLE public.guests
ADD COLUMN zns_sent BOOLEAN DEFAULT FALSE;

-- Add zns_sent column to vip_guests table
ALTER TABLE public.vip_guests
ADD COLUMN zns_sent BOOLEAN DEFAULT FALSE;