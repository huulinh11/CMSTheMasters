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
import { VipGuest } from "@/types/vip-guest";
import { Guest } from "@/types/guest";

type CombinedGuest = (VipGuest | Guest) & { type: 'Chức vụ' | 'Khách mời' };

interface ProfileManagementTableProps {
  guests: CombinedGuest[];
  onCopyLink: (slug: string) => void;
  onEdit: (guest: CombinedGuest) => void;
  onView: (guest: CombinedGuest) => void;
}

export const ProfileManagementTable = ({ guests, onCopyLink, onEdit, onView }: ProfileManagementTableProps) => {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Link Public</TableHead>
            <TableHead className="text-right">Tác vụ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.length > 0 ? (
            guests.map(guest => (
              <TableRow key={guest.id}>
                <TableCell className="font-medium">{guest.name}</TableCell>
                <TableCell>{guest.role}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {guest.slug ? `/profile/${guest.slug}` : "Đang tạo..."}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="secondary" size="icon" onClick={() => onView(guest)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {guest.slug && (
                    <Button variant="outline" size="sm" onClick={() => onCopyLink(guest.slug!)}>
                      <Copy className="mr-2 h-4 w-4" /> Sao chép
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