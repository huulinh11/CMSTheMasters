-- Xóa các chính sách cũ có thể đang gây lỗi
DROP POLICY IF EXISTS "Allow admin/manager to manage permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow authenticated users to read permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow admin/manager to insert permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow admin/manager to update permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow admin/manager to delete permissions" ON public.role_permissions;

-- 1. Tạo chính sách cho phép MỌI người dùng đã đăng nhập có thể ĐỌC quyền hạn
CREATE POLICY "Allow authenticated users to read permissions" ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

-- 2. Tạo chính sách CHẶT CHẼ chỉ cho phép Admin/Quản lý THÊM MỚI quyền hạn
CREATE POLICY "Allow admin/manager to insert permissions" ON public.role_permissions
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Quản lý')
);

-- 3. Tạo chính sách CHẶT CHẼ chỉ cho phép Admin/Quản lý CẬP NHẬT quyền hạn
CREATE POLICY "Allow admin/manager to update permissions" ON public.role_permissions
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Quản lý')
);

-- 4. Tạo chính sách CHẶT CHẼ chỉ cho phép Admin/Quản lý XÓA quyền hạn
CREATE POLICY "Allow admin/manager to delete permissions" ON public.role_permissions
FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Quản lý')
);