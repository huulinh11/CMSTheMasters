-- Xóa trigger và hàm thông báo cũ
DROP TRIGGER IF EXISTS on_public_timeline_change_notify ON public.public_timeline_events;
DROP FUNCTION IF EXISTS public.notify_public_timeline_change();

-- Xóa hàm public_timeline cũ vì chúng ta sẽ thay đổi tham số của nó
DROP FUNCTION IF EXISTS public.publish_timeline();

-- Tạo lại hàm public_timeline với tùy chọn gửi thông báo
CREATE OR REPLACE FUNCTION public.publish_timeline(with_notification boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Dùng TRUNCATE để xóa nhanh dữ liệu cũ
  TRUNCATE public.public_timeline_events;

  -- Sao chép timeline hiện tại sang bảng public
  INSERT INTO public.public_timeline_events (id, "order", duration_minutes, content, notes, participants, created_at)
  SELECT id, "order", duration_minutes, content, notes, participants, created_at
  FROM public.timeline_events;

  -- Nếu tùy chọn with_notification là true, gửi thông báo
  IF with_notification THEN
    -- Để tránh gửi thông báo liên tục, kiểm tra xem đã có thông báo tương tự gần đây chưa
    IF NOT EXISTS (
        SELECT 1 FROM public.guest_notifications
        WHERE guest_id = 'all'
        AND type = 'timeline'
        AND created_at > NOW() - INTERVAL '5 minutes'
    ) THEN
        INSERT INTO public.guest_notifications (guest_id, content, type)
        VALUES (
            'all', -- ID đặc biệt cho tất cả khách mời
            'Timeline sự kiện vừa được cập nhật. Hãy kiểm tra lại nhé!',
            'timeline'
        );
    END IF;
  END IF;
END;
$function$;