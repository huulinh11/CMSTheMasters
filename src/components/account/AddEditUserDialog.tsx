import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppUser, USER_ROLES } from "@/types/app-user";
import { useState, useEffect, useMemo } from "react";
import { allNavItems } from "@/config/nav";
import { Badge } from "@/components/ui/badge";

const getPermissionsForRole = (role: AppUser['role']): string[] => {
  return allNavItems
    .filter(item => item.roles?.includes(role))
    .map(item => item.label);
};

interface AddEditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (user: Partial<AppUser> & { password?: string }) => void;
  isSaving: boolean;
  user: AppUser | null;
}

export const AddEditUserDialog = ({ open, onOpenChange, onSave, isSaving, user }: AddEditUserDialogProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<AppUser['role']>('Nhân viên');

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setFullName(user.full_name);
      setDepartment(user.department);
      setRole(user.role);
      setPassword('');
    } else {
      setUsername('');
      setPassword('');
      setFullName('');
      setDepartment('');
      setRole('Nhân viên');
    }
  }, [user, open]);

  const permissions = useMemo(() => getPermissionsForRole(role), [role]);

  const handleSave = () => {
    const userData: Partial<AppUser> & { password?: string } = {
      id: user?.id,
      username,
      full_name: fullName,
      department,
      role,
    };
    if (password) {
      userData.password = password;
    }
    onSave(userData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}</DialogTitle>
          <DialogDescription>
            {user ? 'Cập nhật thông tin tài khoản.' : 'Điền thông tin để tạo tài khoản mới.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={!!user} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={user ? 'Để trống nếu không đổi' : ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Bộ phận</Label>
            <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Loại phân quyền</Label>
            <Select value={role} onValueChange={(value) => setRole(value as AppUser['role'])}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Chọn quyền" />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Các quyền truy cập</Label>
            <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[40px]">
              {permissions.map(permission => (
                <Badge key={permission} variant="secondary">{permission}</Badge>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};