CREATE OR REPLACE FUNCTION auto_apply_default_template()
RETURNS TRIGGER AS $$
DECLARE
  default_template_id UUID;
  template_content JSONB;
BEGIN
  -- Tìm template mặc định cho vai trò của khách mời mới
  SELECT id, content INTO default_template_id, template_content
  FROM public.profile_templates
  WHERE NEW.role = ANY(assigned_roles)
  LIMIT 1;

  -- Nếu tìm thấy, áp dụng nó
  IF default_template_id IS NOT NULL THEN
    NEW.template_id := default_template_id;
    NEW.profile_content := template_content;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger cho bảng vip_guests
DROP TRIGGER IF EXISTS on_new_vip_guest_apply_template ON public.vip_guests;
CREATE TRIGGER on_new_vip_guest_apply_template
BEFORE INSERT ON public.vip_guests
FOR EACH ROW
EXECUTE FUNCTION auto_apply_default_template();

-- Tạo trigger cho bảng guests
DROP TRIGGER IF EXISTS on_new_guest_apply_template ON public.guests;
CREATE TRIGGER on_new_guest_apply_template
BEFORE INSERT ON public.guests
FOR EACH ROW
EXECUTE FUNCTION auto_apply_default_template();