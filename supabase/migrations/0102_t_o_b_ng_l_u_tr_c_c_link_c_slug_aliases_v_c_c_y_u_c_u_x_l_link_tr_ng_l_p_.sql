-- Bảng lưu trữ các link cũ đã được xác định
CREATE TABLE public.slug_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_slug TEXT NOT NULL UNIQUE,
  guest_id TEXT NOT NULL,
  guest_type TEXT NOT NULL, -- 'vip' or 'regular'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.slug_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read aliases" ON public.slug_aliases FOR SELECT USING (true);
CREATE POLICY "Admins can manage aliases" ON public.slug_aliases FOR ALL USING (get_my_role() = ANY (ARRAY['Admin'::text, 'Quản lý'::text]));

-- Bảng lưu các yêu cầu cần admin duyệt
CREATE TABLE public.slug_resolution_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_slug TEXT NOT NULL,
  provided_name TEXT,
  provided_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.slug_resolution_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert requests" ON public.slug_resolution_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage requests" ON public.slug_resolution_requests FOR ALL USING (get_my_role() = ANY (ARRAY['Admin'::text, 'Quản lý'::text]));