import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Edit, Phone, User, FileText } from "lucide-react";
import { Guest } from "@/types/guest";

interface GuestCardsProps {
  guests: Guest[];
  selectedGuests: string[];
  onSelectGuest: (id: string) => void;
  onEdit: (guest: Guest) => void;
  onDelete: (id: string) => void;
  onView: (guest: Guest) => void;
}

export const GuestCards = ({
  guests,
  selectedGuests,
  onSelectGuest,
  onEdit,
  onDelete,
  onView,
}: GuestCardsProps) => {
  return (
    <div className="space-y-4">
      {guests.length > 0 ? (
        guests.map((guest) => (
          <Card key={guest.id} className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <button onClick={() => onView(guest)} className="text-left pr-2">
                <CardTitle className="text-lg font-semibold text-slate-800 hover:underline">{guest.name}</CardTitle>
              </button>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Checkbox
                  checked={selectedGuests.includes(guest.id)}
                  onCheckedChange={() => onSelectGuest(guest.id)}
                  aria-label={`Select ${guest.name}`}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(guest)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Sửa
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(guest.id)} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex items-center text-sm text-primary bg-primary/10 px-2 py-1 rounded-md w-fit">
                {guest.role} ({guest.id})
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-2 text-slate-600">
                <InfoItem icon={Phone} label="SĐT" value={guest.phone} />
                <InfoItem icon={User} label="Người giới thiệu" value={guest.referrer} />
                <InfoItem icon={FileText} label="Ghi chú" value={guest.notes} />
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-12 text-slate-500">
          <p>Không tìm thấy khách mời nào.</p>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => {
  if (!value) return null;
  return (
    <div className="flex items-start">
      <Icon className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-slate-400" />
      <p>
        <span className="font-medium text-slate-700">{label}:</span> {value}
      </p>
    </div>
  );
};