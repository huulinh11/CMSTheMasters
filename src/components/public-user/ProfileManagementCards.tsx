import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Edit } from "lucide-react";
import { VipGuest } from "@/types/vip-guest";
import { Guest } from "@/types/guest";

type CombinedGuest = (VipGuest | Guest) & { type: 'Chức vụ' | 'Khách mời' };

interface ProfileManagementCardsProps {
  guests: CombinedGuest[];
  onCopyLink: (slug: string) => void;
  onEdit: (guest: CombinedGuest) => void;
}

export const ProfileManagementCards = ({ guests, onCopyLink, onEdit }: ProfileManagementCardsProps) => {
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
                  <span className="text-slate-500">Link Public</span>
                  <span className="font-medium text-slate-800 truncate max-w-[150px]">
                    {guest.slug ? `/profile/${guest.slug.substring(0, 15)}...` : "Chưa có"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {guest.slug && (
                  <Button className="flex-1" variant="outline" onClick={() => onCopyLink(guest.slug!)}>
                    <Copy className="mr-2 h-4 w-4" /> Sao chép
                  </Button>
                )}
                <Button className="flex-1" onClick={() => onEdit(guest)}>
                  <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
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