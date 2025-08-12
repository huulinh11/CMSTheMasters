import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Edit } from "lucide-react";
import { RoleConfiguration } from "@/types/role-configuration";
import { formatCurrency } from "@/lib/utils";

interface RoleConfigCardsProps {
  roles: RoleConfiguration[];
  onEdit: (role: RoleConfiguration) => void;
  onDelete: (id: string) => void;
}

export const RoleConfigCards = ({ roles, onEdit, onDelete }: RoleConfigCardsProps) => {
  return (
    <div className="space-y-4">
      {roles.length > 0 ? (
        roles.map((role) => (
          <Card key={role.id} className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-slate-800">{role.name}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-5 w-5" />
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
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <InfoRow label="Loại vai trò" value={role.type} />
              <InfoRow label="Tiền tài trợ" value={formatCurrency(role.sponsorship_amount)} />
              <InfoRow label="Số chỉ tiêu" value={String(role.referral_quota)} />
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Màu sắc</span>
                <span
                  className="px-2 py-1 rounded-md text-xs font-medium"
                  style={{ backgroundColor: role.bg_color, color: role.text_color }}
                >
                  Xem trước
                </span>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-12 text-slate-500">
          <p>Chưa có vai trò nào được cấu hình.</p>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium text-slate-800">{value}</span>
  </div>
);