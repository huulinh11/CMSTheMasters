CREATE OR REPLACE FUNCTION apply_template_to_guest(
  target_guest_id TEXT,
  target_template_id UUID
)
RETURNS VOID AS $$
DECLARE
  template_content JSONB;
  guest_type TEXT;
BEGIN
  -- Lấy nội dung của template
  SELECT content INTO template_content FROM public.profile_templates WHERE id = target_template_id;

  -- Nếu không tìm thấy template, không làm gì cả
  IF template_content IS NULL THEN
    RETURN;
  END IF;

  -- Xác định loại khách mời và cập nhật
  SELECT CASE WHEN EXISTS (SELECT 1 FROM public.vip_guests WHERE id = target_guest_id) THEN 'vip' ELSE 'regular' END INTO guest_type;

  IF guest_type = 'vip' THEN
    UPDATE public.vip_guests
    SET 
      profile_content = template_content,
      template_id = target_template_id,
      profile_status = 'Trống' -- Reset trạng thái khi áp dụng template mới
    WHERE id = target_guest_id;
  ELSE
    UPDATE public.guests
    SET 
      profile_content = template_content,
      template_id = target_template_id,
      profile_status = 'Trống'
    WHERE id = target_guest_id;
  END IF;
END;
$$ LANGUAGE plpgsql;