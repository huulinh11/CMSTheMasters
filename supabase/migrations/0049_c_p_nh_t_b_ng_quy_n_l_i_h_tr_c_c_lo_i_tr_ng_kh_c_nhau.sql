-- Thêm một kiểu dữ liệu enum để định nghĩa các loại trường có thể có
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'benefit_field_type') THEN
        CREATE TYPE public.benefit_field_type AS ENUM (
            'status_select',
            'simple_link',
            'complex_news',
            'complex_video'
        );
    END IF;
END$$;

-- Thêm cột field_type vào bảng media_benefits_master
ALTER TABLE public.media_benefits_master
ADD COLUMN IF NOT EXISTS field_type public.benefit_field_type NOT NULL DEFAULT 'simple_link';

-- Cập nhật các quyền lợi hiện có với loại trường chính xác
UPDATE public.media_benefits_master SET field_type = 'status_select' WHERE name = 'Thư mời';
UPDATE public.media_benefits_master SET field_type = 'simple_link' WHERE name IN ('Post bài page', 'Post bài BTC', 'Video thảm đỏ', 'Bộ ảnh Beauty AI');
UPDATE public.media_benefits_master SET field_type = 'complex_news' WHERE name IN ('Báo trước sự kiện', 'Báo sau sự kiện');
UPDATE public.media_benefits_master SET field_type = 'complex_video' WHERE name = 'Video đưa tin';