CREATE OR REPLACE FUNCTION public.notify_guest_task_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    notification_content TEXT;
BEGIN
    IF NEW.is_completed THEN
        notification_content := 'Tác vụ "' || NEW.task_name || '" của bạn đã chuyển sang hoàn thành.';
    ELSE
        notification_content := 'Tác vụ "' || NEW.task_name || '" của bạn đã chuyển sang chưa hoàn thành.';
    END IF;

    INSERT INTO public.guest_notifications (guest_id, content, type)
    VALUES (
        NEW.guest_id,
        notification_content,
        'task'
    );
    RETURN NEW;
END;
$function$