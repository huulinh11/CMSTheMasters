-- Đối với các bảng lịch sử, chúng ta sẽ giữ lại bản ghi nhưng xóa liên kết đến người dùng đã bị xóa.
ALTER TABLE public.guest_upsale_history DROP CONSTRAINT IF EXISTS guest_upsale_history_upsaled_by_user_id_fkey;
ALTER TABLE public.guest_upsale_history
ADD CONSTRAINT guest_upsale_history_upsaled_by_user_id_fkey
FOREIGN KEY (upsaled_by_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.upsale_commission_log DROP CONSTRAINT IF EXISTS upsale_commission_log_upsaled_by_user_id_fkey;
ALTER TABLE public.upsale_commission_log
ADD CONSTRAINT upsale_commission_log_upsaled_by_user_id_fkey
FOREIGN KEY (upsaled_by_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Đối với bảng tổng hợp, chúng ta sẽ xóa dòng tổng hợp của người dùng đó.
ALTER TABLE public.upsale_commission_summary DROP CONSTRAINT IF EXISTS upsale_commission_summary_user_id_fkey;
ALTER TABLE public.upsale_commission_summary
ADD CONSTRAINT upsale_commission_summary_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;