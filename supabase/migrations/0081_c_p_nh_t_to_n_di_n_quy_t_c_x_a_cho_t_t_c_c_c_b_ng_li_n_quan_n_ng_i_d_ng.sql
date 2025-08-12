-- Cập nhật quy tắc xóa cho bảng guest_upsale_history
-- Khi một profile bị xóa, trường upsaled_by_user_id sẽ được đặt thành NULL.
ALTER TABLE public.guest_upsale_history DROP CONSTRAINT IF EXISTS guest_upsale_history_upsaled_by_user_id_fkey;
ALTER TABLE public.guest_upsale_history
ADD CONSTRAINT guest_upsale_history_upsaled_by_user_id_fkey
FOREIGN KEY (upsaled_by_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Cập nhật quy tắc xóa cho bảng upsale_commission_log
-- Khi một profile bị xóa, trường upsaled_by_user_id sẽ được đặt thành NULL.
ALTER TABLE public.upsale_commission_log DROP CONSTRAINT IF EXISTS upsale_commission_log_upsaled_by_user_id_fkey;
ALTER TABLE public.upsale_commission_log
ADD CONSTRAINT upsale_commission_log_upsaled_by_user_id_fkey
FOREIGN KEY (upsaled_by_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Cập nhật quy tắc xóa cho bảng upsale_commission_summary
-- Khi một profile bị xóa, trường user_id trong bảng tổng hợp cũng sẽ được đặt thành NULL.
ALTER TABLE public.upsale_commission_summary DROP CONSTRAINT IF EXISTS upsale_commission_summary_user_id_fkey;
ALTER TABLE public.upsale_commission_summary
ADD CONSTRAINT upsale_commission_summary_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;