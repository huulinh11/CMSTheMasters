import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Edit, Eye } from "lucide-react";
import { VipGuest, ProfileStatus } from "@/types/vip-guest";
import { Guest } from "@/types/guest";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type CombinedGuest = (VipGuest | Guest) & { type: 'Chức vụ' | 'Khách mời', profile_status?: ProfileStatus, effectiveStatus: ProfileStatus, templateName?: string };

interface ProfileManagementCardsProps {
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

export const ProfileManagementCards = ({ guests, onCopyLink, onEdit, onView, onStatusChange }: ProfileManagementCardsProps) => {
  return (
    <div className="space-y-4">
      {guests.length > 0 ? (
        guests.map((guest) => (
          <Card key={guest.id} className="bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-800">{guest.name}</CardTitle>
              <p className="text-sm text-slate-500">{guest.role} ({guest.type})</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Template</span>
                  <span className="font-medium">{guest.templateName || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Trạng thái Profile</span>
                  <Badge className={cn(getStatusColor(guest.effectiveStatus))}>{guest.effectiveStatus}</Badge>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id={`completed-card-${guest.id}`}
                    checked={guest.profile_status === 'Hoàn tất'}
                    onCheckedChange={(checked) => onStatusChange(guest, !!checked)}
                  />
                  <label htmlFor={`completed-card-${guest.id}`} className="text-sm font-medium leading-none">
                    Đánh dấu hoàn tất
                  </label>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" variant="secondary" onClick={() => onView(guest)}>
                  <Eye className="h-4 w-4" />
                </Button>
                {guest.slug && (
                  <Button className="flex-1" variant="outline" onClick={() => onCopyLink(guest.slug!)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                <Button className="flex-1" onClick={() => onEdit(guest)}>
                  <Edit className="h-4 w-4" />
                </Button>
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