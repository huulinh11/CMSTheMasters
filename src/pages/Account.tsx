import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppUser, USER_ROLES } from "@/types/app-user";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError } from "@/utils/toast";
import { AddEditUserDialog } from "@/components/account/AddEditUserDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AccountPage = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { session, profile } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: users = [], isLoading, error: queryError } = useQuery<AppUser[]>({
    queryKey: ['app_users', session?.access_token],
    queryFn: async () => {
      if (!session) {
        throw new Error("Xác thực không hợp lệ.");
      }

      const { data, error } = await supabase.functions.invoke('manage-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { method: 'LIST_USERS' },
      });
      
      if (error) {
        if (error.name === 'FunctionsHttpError') {
          const errorBody = await error.context.json();
          throw new Error(errorBody.error || 'Lỗi khi tải danh sách người dùng.');
        }
        throw error;
      }
      return data;
    },
    enabled: !!session,
  });

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchMatch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.username?.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = roleFilter === 'all' || user.role === roleFilter;
      return searchMatch && roleMatch;
    });
  }, [users, searchTerm, roleFilter]);

  const mutation = useMutation({
    mutationFn: async (payload: { method: string, payload: any }) => {
      if (!session) {
        throw new Error("Xác thực không hợp lệ.");
      }

      const { data, error } = await supabase.functions.invoke('manage-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: payload,
      });
      if (error) {
        if (error.name === 'FunctionsHttpError') {
          const errorBody = await error.context.json();
          throw new Error(errorBody.error || 'Thao tác thất bại.');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app_users'] });
      showSuccess(`Thao tác thành công!`);
    },
    onError: (error: Error) => {
      showError(error.message);
    },
    onSettled: () => {
      setIsDialogOpen(false);
      setEditingUser(null);
    },
  });

  const handleSaveUser = (user: Partial<AppUser> & { password?: string }) => {
    const method = user.id ? 'UPDATE_USER' : 'CREATE_USER';
    mutation.mutate({ method, payload: user });
  };

  const handleDeleteUser = (userToDelete: AppUser) => {
    if (profile?.id === userToDelete.id) {
      showError("Bạn không thể tự xóa tài khoản của mình.");
      return;
    }
    mutation.mutate({ method: 'DELETE_USER', payload: { id: userToDelete.id } });
  };

  const handleOpenDialog = (user: AppUser | null) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  if (queryError) {
    return <div className="p-4 md:p-6 text-red-500">Lỗi tải dữ liệu: {queryError.message}</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader title="Quản lý tài khoản">
        <Button onClick={() => handleOpenDialog(null)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Thêm tài khoản
        </Button>
      </PageHeader>

      <div className="flex flex-col md:flex-row gap-2">
        <Input
          placeholder="Tìm kiếm theo tên, username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Lọc theo loại tài khoản" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {USER_ROLES.map(role => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isMobile ? (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle>{user.full_name}</CardTitle>
                <p className="text-sm text-muted-foreground">{user.username} - {user.role}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(user)}><Edit className="mr-2 h-4 w-4" /> Sửa</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user)} disabled={profile?.id === user.id}><Trash2 className="mr-2 h-4 w-4" /> Xóa</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ và tên</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Loại phân quyền</TableHead>
                <TableHead className="text-right">Tác vụ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell><Badge>{user.role}</Badge></TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(user)}>Sửa</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user)} disabled={profile?.id === user.id}>Xóa</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddEditUserDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveUser}
        isSaving={mutation.isPending}
        user={editingUser}
        currentUserRole={profile?.role}
      />
    </div>
  );
};

export default AccountPage;