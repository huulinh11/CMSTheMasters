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
import { Edit, Eye, PlusCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface InformationTableProps {
  guests: VipGuest[];
  onEdit: (guest: VipGuest) => void;
}

const truncateText = (text: string | undefined, length: number) => {
  if (!text) return "N/A";
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
};

export const InformationTable = ({ guests, onEdit }: InformationTableProps) => {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Vai trò</TableHead>
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
                  <button onClick={() => onEdit(guest)} className="text-left hover:underline">
                    {truncateText(guest.secondaryInfo, 20)}
                  </button>
                </TableCell>
                <TableCell>
                  <button onClick={() => onEdit(guest)} className="text-left hover:underline">
                    {truncateText(guest.materials, 20)}
                  </button>
                </TableCell>
                <TableCell>
                  <a href={guest.facebook_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {truncateText(guest.facebook_link, 20)}
                  </a>
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
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onEdit(guest)}>
                    <Edit className="mr-2 h-4 w-4" /> Sửa
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                Không tìm thấy kết quả.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};