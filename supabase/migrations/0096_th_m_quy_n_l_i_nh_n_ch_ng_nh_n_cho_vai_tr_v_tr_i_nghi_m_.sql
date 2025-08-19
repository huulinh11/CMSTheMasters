-- Add the new benefit to the master list
INSERT INTO public.media_benefits_master (name, field_type)
VALUES ('Nhận chứng nhận', 'simple_link')
ON CONFLICT (name) DO NOTHING;

-- Assign the new benefit to the 'Vé trải nghiệm' role
INSERT INTO public.role_benefits (role_name, benefit_name)
VALUES ('Vé trải nghiệm', 'Nhận chứng nhận')
ON CONFLICT (role_name, benefit_name) DO NOTHING;