-- One-time fix to ensure the admin user has a profile
INSERT INTO public.profiles (id, full_name, department, role)
SELECT id, 'Administrator', 'System', 'Admin'
FROM auth.users
WHERE email = 'admin@event.app'
ON CONFLICT (id) DO NOTHING;