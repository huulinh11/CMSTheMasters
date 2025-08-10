-- Create notifications table
CREATE TABLE public.guest_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id TEXT NOT NULL, -- Can be a specific guest_id or 'all' for global notifications
  content TEXT NOT NULL,
  type TEXT NOT NULL, -- 'task', 'benefit', 'timeline'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.guest_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can read notifications" ON public.guest_notifications
FOR SELECT USING (true);

-- Function to create notification on guest_task change
CREATE OR REPLACE FUNCTION public.notify_guest_task_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.guest_notifications (guest_id, content, type)
    VALUES (
        NEW.guest_id,
        'Tác vụ "' || NEW.task_name || '" của bạn đã được cập nhật trạng thái.',
        'task'
    );
    RETURN NEW;
END;
$$;

-- Trigger for guest_tasks
DROP TRIGGER IF EXISTS on_guest_task_change_notify ON public.guest_tasks;
CREATE TRIGGER on_guest_task_change_notify
  AFTER INSERT OR UPDATE ON public.guest_tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_guest_task_change();

-- Function to create notification on media_benefit change
CREATE OR REPLACE FUNCTION public.notify_media_benefit_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.guest_notifications (guest_id, content, type)
    VALUES (
        NEW.guest_id,
        'Quyền lợi truyền thông của bạn vừa được cập nhật.',
        'benefit'
    );
    RETURN NEW;
END;
$$;

-- Trigger for media_benefits
DROP TRIGGER IF EXISTS on_media_benefit_change_notify ON public.media_benefits;
CREATE TRIGGER on_media_benefit_change_notify
  AFTER INSERT OR UPDATE ON public.media_benefits
  FOR EACH ROW EXECUTE FUNCTION public.notify_media_benefit_change();

-- Function to create notification on public_timeline change
CREATE OR REPLACE FUNCTION public.notify_public_timeline_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    -- To avoid spamming notifications, check if a similar notification was created recently.
    IF NOT EXISTS (
        SELECT 1 FROM public.guest_notifications
        WHERE guest_id = 'all'
        AND type = 'timeline'
        AND created_at > NOW() - INTERVAL '5 minutes'
    ) THEN
        INSERT INTO public.guest_notifications (guest_id, content, type)
        VALUES (
            'all', -- Special ID for all guests
            'Timeline sự kiện vừa được cập nhật. Hãy kiểm tra lại nhé!',
            'timeline'
        );
    END IF;
    RETURN NULL;
END;
$$;

-- Trigger for public_timeline_events
DROP TRIGGER IF EXISTS on_public_timeline_change_notify ON public.public_timeline_events;
CREATE TRIGGER on_public_timeline_change_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.public_timeline_events
  FOR EACH STATEMENT EXECUTE FUNCTION public.notify_public_timeline_change();