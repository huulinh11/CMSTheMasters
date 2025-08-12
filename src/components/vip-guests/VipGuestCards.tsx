import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Edit, Phone, User, Info } from "lucide-react";
import { VipGuest } from "@/types/vip-guest";
import { RoleConfiguration } from "@/types/role-configuration";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VipGuestCardsProps {
  guests: VipGuest[];
  selectedGuests: string[];
  onSelectGuest: (id: string) => void;
  onEdit: (guest: VipGuest) => void;
  onDelete: (id: string) => void;
  onView: (guest: VipGuest) => void;
  roleConfigs: RoleConfiguration[];
  canDelete: boolean;
}

export const VipGuestCards = ({
  guests,
  selectedGuests,
  onSelectGuest,
  onEdit,
  onDelete,
  onView,
  roleConfigs,
  canDelete,
}: VipGuestCardsProps) => {

  const getRoleColors = (roleName: string) => {
    const config = roleConfigs.find(rc => rc.name === roleName);
    return {
      backgroundColor: config?.bg_color || '#EFF6FF',
      color: config?.text_color || '#1E40AF',
    };
  };

  return (
    <div className="space-y-4">
      {guests.length > 0 ? (
        guests.map((guest) => (
          <Card key={guest.id} className="bg-white shadow-sm overflow-hidden">
            <div className="p-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 flex-grow min-w-0" onClick={() => onView(guest)}>
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={guest.image_url} alt={guest.name} />
                    <AvatarFallback>{guest.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow min-w-0">
                    <h3 className="text-base font-bold leading-tight hover:underline truncate">{guest.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{guest.role} ({guest.id})</p>
                  </div>
                </div>
                <div className="flex items-center flex-shrink-0">
                  <Checkbox
                    checked={selectedGuests.includes(guest.id)}
                    onCheckedChange={() => onSelectGuest(guest.id)}
                    aria-label={`Select ${guest.name}`}
                    className="mr-1"
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
                      {canDelete && (
                        <DropdownMenuItem onClick={() => onDelete(guest.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardContent className="pt-3 px-0 pb-0 space-y-1 text-xs text-slate-600">
                <InfoItem icon={Phone} value={guest.phone} />
                <InfoItem icon={Info} value={guest.secondaryInfo} />
                <InfoItem icon={User} value={guest.referrer} />
              </CardContent>
            </div>
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

const InfoItem = ({ icon: Icon, value }: { icon: React.ElementType, value?: string | null }) => {
  if (!value) return null;
  return (
    <div className="flex items-center text-xs text-slate-600">
      <Icon className="h-3 w-3 mr-1.5 flex-shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  );
};