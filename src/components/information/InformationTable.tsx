import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { VipGuest } from "@/types/vip-guest";
import { Edit, Eye, PlusCircle, Copy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showSuccess } from "@/utils/toast";

interface InformationTableProps {
  guests: VipGuest[];
  onEdit: (guest: VipGuest) => void;
  onView: (guest: VipGuest) => void;
}

const handleCopy = (textToCopy: string | undefined, label: string) => {
  if (!textToCopy) return;
  navigator.clipboard.writeText(textToCopy);
  showSuccess(`Đã sao chép ${label}!`);
};

export const InformationTable = ({ guests, onEdit, onView }: InformationTableProps) => {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>SĐT</TableHead>
            <TableHead>Thông tin phụ</TableHead>
            <TableHead>Tư liệu</TableHead>
            <TableHead>Link Facebook</TableHead>
            <TableHead>Profile</TableHead>
            <TableHead>Ảnh</TableHead>
            <TableHead className="text-right">Tác vụ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.length > 0 ? (
            guests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell>{guest.id}</TableCell>
                <TableCell className="font-semibold">{guest.name}</TableCell>
                <TableCell>{guest.role}</TableCell>
                <TableCell>
                  {guest.phone ? (
                    <div className="flex items-center gap-1">
                      <a href={`tel:${guest.phone}`} className="hover:underline">{guest.phone}</a>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(guest.phone, 'SĐT')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>
                  <button onClick={() => handleCopy(guest.secondaryInfo, 'Thông tin phụ')} className="text-left hover:underline w-full max-w-[150px]">
                    <p className="truncate" title={guest.secondaryInfo}>
                      {guest.secondaryInfo || "N/A"}
                    </p>
                  </button>
                </TableCell>
                <TableCell>
                  <button onClick={() => handleCopy(guest.materials, 'Tư liệu')} className="text-left hover:underline w-full max-w-[150px]">
                    <p className="truncate" title={guest.materials}>
                      {guest.materials || "N/A"}
                    </p>
                  </button>
                </TableCell>
                <TableCell>
                  {guest.facebook_link ? (
                    <div className="flex items-center gap-1">
                      <a href={guest.facebook_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Link
                      </a>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(guest.facebook_link, 'Link Facebook')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(guest)}>
                    {guest.profile_content ? <Eye className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                  </Button>
                </TableCell>
                <TableCell>
                  <Avatar>
                    <AvatarImage src={guest.image_url} alt={guest.name} />
                    <AvatarFallback>{guest.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="icon" onClick={() => onView(guest)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="default" size="icon" onClick={() => onEdit(guest)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center">
                Không tìm thấy kết quả.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};