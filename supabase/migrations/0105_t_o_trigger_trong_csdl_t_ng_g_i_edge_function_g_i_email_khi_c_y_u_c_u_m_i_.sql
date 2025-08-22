CREATE OR REPLACE FUNCTION notify_slug_resolution_request()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Chỉ gửi thông báo cho các yêu cầu đang chờ xử lý
  IF NEW.status = 'pending' THEN
    PERFORM net.http_post(
      url:='https://bjrpwswlcafpfdwhyraw.supabase.co/functions/v1/send-resolution-email',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqcnB3c3dsY2FmcGZkd2h5cmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTc0ODAsImV4cCI6MjA2OTQ3MzQ4MH0.hDaH7AUNAo8qbtTKt1s6UUhbrfUGVxuuNvEqucGcxvo"}'::jsonb,
      body:=jsonb_build_object('record', NEW)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_slug_request ON public.slug_resolution_requests;
CREATE TRIGGER on_new_slug_request
AFTER INSERT ON public.slug_resolution_requests
FOR EACH ROW
EXECUTE FUNCTION notify_slug_resolution_request();