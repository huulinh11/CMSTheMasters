-- Create the role_permissions table
CREATE TABLE public.role_permissions (
  role TEXT PRIMARY KEY,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Policies for Admin/Manager access
CREATE POLICY "Allow admin/manager to manage permissions" ON public.role_permissions
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Quản lý')
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Quản lý')
);

-- Seed initial data based on the current hardcoded config
INSERT INTO public.role_permissions (role, permissions) VALUES
('Admin', '["dashboard", "guests", "media-benefits", "event-tasks", "information", "revenue", "timeline", "public-user", "account", "settings"]'),
('Quản lý', '["dashboard", "guests", "media-benefits", "event-tasks", "information", "revenue", "timeline", "public-user", "account", "settings"]'),
('Nhân viên', '["dashboard", "guests", "media-benefits", "event-tasks", "information", "timeline", "public-user", "settings"]'),
('Sale', '["dashboard", "guests", "media-benefits", "event-tasks", "information", "revenue", "timeline", "public-user", "settings"]')
ON CONFLICT (role) DO NOTHING;