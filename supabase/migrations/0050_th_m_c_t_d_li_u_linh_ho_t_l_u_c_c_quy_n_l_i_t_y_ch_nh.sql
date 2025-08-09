-- Thêm một cột JSONB linh hoạt để lưu dữ liệu cho các quyền lợi mới, tùy chỉnh.
ALTER TABLE public.media_benefits
ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;