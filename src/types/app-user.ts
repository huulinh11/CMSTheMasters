export type AppUser = {
  id: string;
  username: string;
  full_name: string;
  department: string;
  role: 'Admin' | 'Quản lý' | 'Nhân viên' | 'Sale' | 'QL ekip';
};

export const USER_ROLES: AppUser['role'][] = ['Admin', 'Quản lý', 'Nhân viên', 'Sale', 'QL ekip'];