CREATE OR REPLACE FUNCTION apply_template_to_role(
  target_role TEXT,
  target_template_id UUID
)
RETURNS VOID AS $$
DECLARE
  template_content JSONB;
BEGIN
  -- Lấy nội dung của template
  SELECT content INTO template_content FROM public.profile_templates WHERE id = target_template_id;

  -- Nếu không tìm thấy template, không làm gì cả
  IF template_content IS NULL THEN
    RETURN;
  END IF;

  -- Cập nhật cho VIP guests
  UPDATE public.vip_guests
  SET 
    profile_content = template_content,
    template_id = target_template_id,
    profile_status = 'Trống'
  WHERE role = target_role AND template_id IS NULL; -- Chỉ áp dụng cho những ai chưa có template riêng

  -- Cập nhật cho regular guests
  UPDATE public.guests
  SET 
    profile_content = template_content,
    template_id = target_template_id,
    profile_status = 'Trống'
  WHERE role = target_role AND template_id IS NULL;
END;
$$ LANGUAGE plpgsql;