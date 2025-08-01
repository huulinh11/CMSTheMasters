import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VipGuest } from "@/types/vip-guest";
import { Edit, Eye, Link, FileText, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface InformationCardsProps {
  guests: VipGuest[];
  onEdit: (guest: VipGuest) => void;
}

export const InformationCards = ({ guests, onEdit }: InformationCardsProps) => {
  return (
    <div className="space-y-4">
      {guests.length > 0 ? (
        guests.map((guest) => (
          <Card key={guest.id} className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={guest.image_url} alt={guest.name} />
                  <AvatarFallback>{guest.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-800">{guest.name}</CardTitle>
                  <p className="text-sm text-slate-500">{guest.role} ({guest.id})</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onEdit(guest)}>
                <Edit className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="border-t border-slate-100 pt-3 space-y-2 text-slate-600">
                <InfoItem icon={Info} label="Thông tin phụ" value={guest.secondaryInfo} />
                <InfoItem icon={FileText} label="Tư liệu" value={guest.materials} />
                <InfoItem icon={Link} label="Facebook" value={guest.facebook_link} isLink />
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-3 mt-1 flex-shrink-0 text-slate-400" />
                    <p className="text-sm text-slate-500">Profile</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(guest)}>
                    {guest.profile_content ? "Xem/Sửa" : "Thêm"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-12 text-slate-500">
          <p>Không có dữ liệu.</p>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value, isLink = false }: { icon: React.ElementType, label: string, value?: string, isLink?: boolean }) => {
  if (!value) return null;
  return (
    <div className="flex items-start">
      <Icon className="h-4 w-4 mr-3 mt-1 flex-shrink-0 text-slate-400" />
      <div className="text-sm flex-1 overflow-hidden">
        <p className="text-slate-500">{label}</p>
        {isLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 break-all hover:underline">
            {value}
          </a>
        ) : (
          <p className="font-medium text-slate-800 whitespace-pre-wrap">{value}</p>
        )}
      </div>
    </div>
  );
};