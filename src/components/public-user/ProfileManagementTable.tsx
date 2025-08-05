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
import { VipGuest, ProfileStatus, PROFILE_STATUSES } from "@/types/vip-guest";
import { Guest } from "@/types/guest";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CombinedGuest = (VipGuest | Guest) & { type: 'Chức vụ' | 'Khách mời', profile_status?: ProfileStatus };

interface ProfileManagementTableProps {
  guests: CombinedGuest[];
  onCopyLink: (slug: string) => void;
  onEdit: (guest: CombinedGuest) => void;
  onView: (guest: CombinedGuest) => void;
  onStatusChange: (guest: CombinedGuest, status: ProfileStatus) => void;
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
                  <Select value={guest.profile_status || 'Trống'} onValueChange={(v) => onStatusChange(guest, v as ProfileStatus)}>
                    <SelectTrigger className={cn("w-[150px] border-none focus:ring-0", getStatusColor(guest.profile_status || 'Trống'))}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFILE_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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