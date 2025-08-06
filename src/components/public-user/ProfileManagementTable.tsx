import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Edit, Eye } from "lucide-react";
import { VipGuest, ProfileStatus } from "@/types/vip-guest";
import { Guest } from "@/types/guest";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type CombinedGuest = (VipGuest | Guest) & { type: 'Chức vụ' | 'Khách mời', profile_status?: ProfileStatus, effectiveStatus: ProfileStatus };

interface ProfileManagementTableProps {
  guests: CombinedGuest[];
  onCopyLink: (slug: string) => void;
  onEdit: (guest: CombinedGuest) => void;
  onView: (guest: CombinedGuest) => void;
  onStatusChange: (guest: CombinedGuest, isCompleted: boolean) => void;
}

const getStatusColor = (status: ProfileStatus) => {
  switch (status) {
    case 'Hoàn tất': return 'bg-green-100 text-green-800';
    case 'Đang chỉnh sửa': return 'bg-yellow-100 text-yellow-800';
    case 'Trống':
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

export const ProfileManagementTable = ({ guests, onCopyLink, onEdit, onView, onStatusChange }: ProfileManagementTableProps) => {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Trạng thái Profile</TableHead>
            <TableHead className="text-right">Tác vụ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.length > 0 ? (
            guests.map(guest => (
              <TableRow key={guest.id}>
                <TableCell className="font-medium">{guest.name}</TableCell>
                <TableCell>{guest.role}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Badge className={cn(getStatusColor(guest.effectiveStatus))}>{guest.effectiveStatus}</Badge>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`completed-${guest.id}`}
                        checked={guest.profile_status === 'Hoàn tất'}
                        onCheckedChange={(checked) => onStatusChange(guest, !!checked)}
                      />
                      <label htmlFor={`completed-${guest.id}`} className="text-sm font-medium leading-none">
                        Hoàn tất
                      </label>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="secondary" size="icon" onClick={() => onView(guest)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {guest.slug && (
                    <Button variant="outline" size="icon" onClick={() => onCopyLink(guest.slug!)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="default" size="icon" onClick={() => onEdit(guest)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                Không tìm thấy khách mời.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};