-- Step 1: Ensure all necessary roles exist in the configurations table.
INSERT INTO public.role_configurations (name, type, sponsorship_amount) VALUES
('Prime Speaker', 'Chức vụ', 0),
('Guest Speaker', 'Chức vụ', 0),
('Mentor kiến tạo', 'Chức vụ', 0),
('Đại sứ', 'Chức vụ', 0),
('Phó BTC', 'Chức vụ', 0),
('Cố vấn', 'Chức vụ', 0),
('Giám đốc', 'Chức vụ', 0),
('Nhà tài trợ', 'Chức vụ', 0),
('Khách phổ thông', 'Khách mời', 0),
('VIP', 'Khách mời', 0),
('V-VIP', 'Khách mời', 0),
('Super Vip', 'Khách mời', 0),
('Vé trải nghiệm', 'Khách mời', 0)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create master tables if they don't exist.
CREATE TABLE IF NOT EXISTS public.event_tasks_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.event_tasks_master ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to event_tasks_master" ON public.event_tasks_master;
CREATE POLICY "Allow all access to event_tasks_master" ON public.event_tasks_master FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.media_benefits_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.media_benefits_master ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to media_benefits_master" ON public.media_benefits_master;
CREATE POLICY "Allow all access to media_benefits_master" ON public.media_benefits_master FOR ALL USING (true) WITH CHECK (true);

-- Step 3: Create linking tables if they don't exist.
CREATE TABLE IF NOT EXISTS public.role_tasks (
  role_name TEXT NOT NULL,
  task_name TEXT NOT NULL,
  PRIMARY KEY (role_name, task_name)
);
ALTER TABLE public.role_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to role_tasks" ON public.role_tasks;
CREATE POLICY "Allow all access to role_tasks" ON public.role_tasks FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.role_benefits (
  role_name TEXT NOT NULL,
  benefit_name TEXT NOT NULL,
  PRIMARY KEY (role_name, benefit_name)
);
ALTER TABLE public.role_benefits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to role_benefits" ON public.role_benefits;
CREATE POLICY "Allow all access to role_benefits" ON public.role_benefits FOR ALL USING (true) WITH CHECK (true);

-- Step 4: Add foreign key constraints if they don't exist.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_tasks_role_name_fkey') THEN
    ALTER TABLE public.role_tasks ADD CONSTRAINT role_tasks_role_name_fkey FOREIGN KEY (role_name) REFERENCES public.role_configurations(name) ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_tasks_task_name_fkey') THEN
    ALTER TABLE public.role_tasks ADD CONSTRAINT role_tasks_task_name_fkey FOREIGN KEY (task_name) REFERENCES public.event_tasks_master(name) ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_benefits_role_name_fkey') THEN
    ALTER TABLE public.role_benefits ADD CONSTRAINT role_benefits_role_name_fkey FOREIGN KEY (role_name) REFERENCES public.role_configurations(name) ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_benefits_benefit_name_fkey') THEN
    ALTER TABLE public.role_benefits ADD CONSTRAINT role_benefits_benefit_name_fkey FOREIGN KEY (benefit_name) REFERENCES public.media_benefits_master(name) ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END;
$$;

-- Step 5: Populate master tables.
INSERT INTO public.event_tasks_master (name) VALUES
('Checkin + Phiếu ăn'), ('MC đọc thảm đỏ + quay'), ('Phỏng vấn'), ('Vinh danh sân khấu'), ('Trao cúp cho khách mời'), ('Nghệ sĩ quay chụp booth'), ('Quay chụp thuyết trình'), ('Quay chụp trình diễn lần 1'), ('Quay chụp trình diễn lần 2'), ('Đi catwalk + cầm mic nói'), ('Nhận chứng nhận'), ('Nhận cúp'), ('Nghệ sĩ chụp booth'), ('Lễ trao sash'), ('Trao cúp cho vai trò'), ('Quay chụp booth'), ('Checkin'), ('Nhận cúp trên sân khấu'), ('chụp ảnh AI')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.media_benefits_master (name) VALUES
('Thư mời'), ('Post bài page'), ('Post bài BTC'), ('Báo trước sự kiện'), ('Báo sau sự kiện'), ('Video thảm đỏ'), ('Video đưa tin'), ('Bộ ảnh Beauty AI')
ON CONFLICT (name) DO NOTHING;

-- Step 6: Populate linking tables.
INSERT INTO public.role_tasks (role_name, task_name) VALUES
('Prime Speaker', 'Checkin + Phiếu ăn'), ('Prime Speaker', 'MC đọc thảm đỏ + quay'), ('Prime Speaker', 'Phỏng vấn'), ('Prime Speaker', 'Vinh danh sân khấu'), ('Prime Speaker', 'Trao cúp cho khách mời'), ('Prime Speaker', 'Nghệ sĩ quay chụp booth'), ('Prime Speaker', 'Quay chụp thuyết trình'), ('Prime Speaker', 'Quay chụp trình diễn lần 1'), ('Prime Speaker', 'Quay chụp trình diễn lần 2'), ('Prime Speaker', 'Đi catwalk + cầm mic nói'), ('Prime Speaker', 'Nhận chứng nhận'), ('Prime Speaker', 'Nhận cúp'),
('Guest Speaker', 'Checkin + Phiếu ăn'), ('Guest Speaker', 'MC đọc thảm đỏ + quay'), ('Guest Speaker', 'Phỏng vấn'), ('Guest Speaker', 'Vinh danh sân khấu'), ('Guest Speaker', 'Trao cúp cho khách mời'), ('Guest Speaker', 'Nghệ sĩ chụp booth'), ('Guest Speaker', 'Quay chụp trình diễn lần 1'), ('Guest Speaker', 'Quay chụp trình diễn lần 2'), ('Guest Speaker', 'Đi catwalk + cầm mic nói'), ('Guest Speaker', 'Nhận chứng nhận'), ('Guest Speaker', 'Nhận cúp'),
('Mentor kiến tạo', 'Checkin + Phiếu ăn'), ('Mentor kiến tạo', 'MC đọc thảm đỏ + quay'), ('Mentor kiến tạo', 'Phỏng vấn'), ('Mentor kiến tạo', 'Vinh danh sân khấu'), ('Mentor kiến tạo', 'Trao cúp cho khách mời'), ('Mentor kiến tạo', 'Nhận chứng nhận'), ('Mentor kiến tạo', 'Nhận cúp'),
('Đại sứ', 'Checkin + Phiếu ăn'), ('Đại sứ', 'MC đọc thảm đỏ + quay'), ('Đại sứ', 'Phỏng vấn'), ('Đại sứ', 'Lễ trao sash'), ('Đại sứ', 'Nhận cúp'), ('Đại sứ', 'Trao cúp cho vai trò'), ('Đại sứ', 'Trao cúp cho khách mời'),
('Phó BTC', 'MC đọc thảm đỏ + quay'), ('Phó BTC', 'Phỏng vấn'), ('Phó BTC', 'Trao cúp cho khách mời'),
('Cố vấn', 'Checkin + Phiếu ăn'), ('Cố vấn', 'MC đọc thảm đỏ + quay'), ('Cố vấn', 'Phỏng vấn'), ('Cố vấn', 'Vinh danh sân khấu'), ('Cố vấn', 'Nhận cúp'), ('Cố vấn', 'Trao cúp cho vai trò'), ('Cố vấn', 'Trao cúp cho khách mời'),
('Giám đốc', 'Checkin + Phiếu ăn'), ('Giám đốc', 'MC đọc thảm đỏ + quay'), ('Giám đốc', 'Phỏng vấn'), ('Giám đốc', 'Trao cúp cho khách mời'),
('Nhà tài trợ', 'Checkin + Phiếu ăn'), ('Nhà tài trợ', 'MC đọc thảm đỏ + quay'), ('Nhà tài trợ', 'Phỏng vấn'), ('Nhà tài trợ', 'Trao cúp cho vai trò'), ('Nhà tài trợ', 'Trao cúp cho khách mời'), ('Nhà tài trợ', 'Quay chụp booth'), ('Nhà tài trợ', 'Nghệ sĩ quay chụp booth'),
('Khách phổ thông', 'Checkin'), ('Khách phổ thông', 'Nhận cúp trên sân khấu'), ('Khách phổ thông', 'Nhận cúp'), ('Khách phổ thông', 'Nhận chứng nhận'),
('VIP', 'Checkin + Phiếu ăn'), ('VIP', 'Phỏng vấn'), ('VIP', 'Nhận cúp trên sân khấu'), ('VIP', 'Nhận cúp'), ('VIP', 'Nhận chứng nhận'), ('VIP', 'chụp ảnh AI'),
('V-VIP', 'Checkin + Phiếu ăn'), ('V-VIP', 'MC đọc thảm đỏ + quay'), ('V-VIP', 'Phỏng vấn'), ('V-VIP', 'Nhận cúp trên sân khấu'), ('V-VIP', 'Nhận cúp'), ('V-VIP', 'Nhận chứng nhận'), ('V-VIP', 'chụp ảnh AI'),
('Super Vip', 'Checkin + Phiếu ăn'),
('Vé trải nghiệm', 'Checkin')
ON CONFLICT (role_name, task_name) DO NOTHING;

INSERT INTO public.role_benefits (role_name, benefit_name) VALUES
('Prime Speaker', 'Thư mời'), ('Prime Speaker', 'Post bài page'), ('Prime Speaker', 'Post bài BTC'), ('Prime Speaker', 'Báo trước sự kiện'), ('Prime Speaker', 'Báo sau sự kiện'), ('Prime Speaker', 'Video thảm đỏ'), ('Prime Speaker', 'Video đưa tin'),
('Guest Speaker', 'Thư mời'), ('Guest Speaker', 'Post bài page'), ('Guest Speaker', 'Post bài BTC'), ('Guest Speaker', 'Báo trước sự kiện'), ('Guest Speaker', 'Báo sau sự kiện'), ('Guest Speaker', 'Video thảm đỏ'), ('Guest Speaker', 'Video đưa tin'),
('Mentor kiến tạo', 'Thư mời'), ('Mentor kiến tạo', 'Post bài page'), ('Mentor kiến tạo', 'Post bài BTC'), ('Mentor kiến tạo', 'Báo trước sự kiện'), ('Mentor kiến tạo', 'Báo sau sự kiện'), ('Mentor kiến tạo', 'Video thảm đỏ'), ('Mentor kiến tạo', 'Video đưa tin'),
('Đại sứ', 'Thư mời'), ('Đại sứ', 'Post bài page'), ('Đại sứ', 'Post bài BTC'), ('Đại sứ', 'Báo trước sự kiện'), ('Đại sứ', 'Báo sau sự kiện'), ('Đại sứ', 'Video thảm đỏ'), ('Đại sứ', 'Video đưa tin'),
('Phó BTC', 'Thư mời'), ('Phó BTC', 'Post bài page'), ('Phó BTC', 'Post bài BTC'), ('Phó BTC', 'Báo trước sự kiện'), ('Phó BTC', 'Báo sau sự kiện'), ('Phó BTC', 'Video thảm đỏ'), ('Phó BTC', 'Video đưa tin'),
('Cố vấn', 'Thư mời'), ('Cố vấn', 'Post bài page'), ('Cố vấn', 'Post bài BTC'), ('Cố vấn', 'Báo trước sự kiện'), ('Cố vấn', 'Báo sau sự kiện'), ('Cố vấn', 'Video thảm đỏ'), ('Cố vấn', 'Video đưa tin'),
('Giám đốc', 'Thư mời'), ('Giám đốc', 'Post bài page'), ('Giám đốc', 'Post bài BTC'), ('Giám đốc', 'Báo trước sự kiện'), ('Giám đốc', 'Báo sau sự kiện'), ('Giám đốc', 'Video thảm đỏ'), ('Giám đốc', 'Video đưa tin'),
('Nhà tài trợ', 'Thư mời'), ('Nhà tài trợ', 'Post bài page'), ('Nhà tài trợ', 'Post bài BTC'), ('Nhà tài trợ', 'Báo trước sự kiện'), ('Nhà tài trợ', 'Báo sau sự kiện'), ('Nhà tài trợ', 'Video thảm đỏ'), ('Nhà tài trợ', 'Video đưa tin'),
('Khách phổ thông', 'Thư mời'),
('VIP', 'Thư mời'), ('VIP', 'Báo sau sự kiện'), ('VIP', 'Bộ ảnh Beauty AI'),
('V-VIP', 'Thư mời'), ('V-VIP', 'Báo sau sự kiện'), ('V-VIP', 'Bộ ảnh Beauty AI'), ('V-VIP', 'Video thảm đỏ'),
('Super Vip', 'Thư mời'),
('Vé trải nghiệm', 'Thư mời')
ON CONFLICT (role_name, benefit_name) DO NOTHING;