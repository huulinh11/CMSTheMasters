import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Edit } from "lucide-react";
import { RoleConfiguration } from "@/types/role-configuration";
import { formatCurrency } from "@/lib/utils";

interface RoleConfigTableProps {
  roles: RoleConfiguration[];
  onEdit: (role: RoleConfiguration) => void;
  onDelete: (id: string) => void;
}

export const RoleConfigTable = ({ roles, onEdit, onDelete }: RoleConfigTableProps) => {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên vai trò</TableHead>
            <TableHead>Loại vai trò</TableHead>
            <TableHead>Số tiền tài trợ</TableHead>
            <TableHead>Số chỉ tiêu</TableHead>
            <TableHead>Màu sắc</TableHead>
            <TableHead className="text-right">Tác vụ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.length > 0 ? (
            roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-semibold text-slate-800">{role.name}</TableCell>
                <TableCell>{role.type}</TableCell>
                <TableCell>{formatCurrency(role.sponsorship_amount)}</TableCell>
                <TableCell>{role.referral_quota}</TableCell>
                <TableCell>
                  <span
                    className="px-2 py-1 rounded-md text-xs font-medium"
                    style={{ backgroundColor: role.bg_color, color: role.text_color }}
                  >
                    Xem trước
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Mở menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(role)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(role.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Chưa có vai trò nào được cấu hình.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};