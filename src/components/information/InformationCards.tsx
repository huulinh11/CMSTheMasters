import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VipGuest } from "@/types/vip-guest";
import { Edit, Eye, Link, FileText, Info, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showSuccess } from "@/utils/toast";
import { RoleConfiguration } from "@/types/role-configuration";

interface InformationCardsProps {
  guests: VipGuest[];
  onEdit: (guest: VipGuest) => void;
  roleConfigs: RoleConfiguration[];
}

const InfoItem = ({ icon: Icon, label, value, isLink = false, isCopyable = false }: { icon: React.ElementType, label: string, value?: string, isLink?: boolean, isCopyable?: boolean }) => {
  if (!value) return null;

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    showSuccess(`Đã sao chép ${label}`);
  };

  const itemContent = (
    <div className="flex items-start">
      <Icon className="h-4 w-4 mr-3 mt-1 flex-shrink-0 text-[rgb(185,179,176)]" />
      <p className="text-sm text-left">
        <span className="text-[rgb(185,179,176)] font-normal">{label}: </span>
        {isLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-normal hover:underline break-all">
            {value}
          </a>
        ) : (
          <span className="text-black font-normal">{value}</span>
        )}
      </p>
    </div>
  );

  if (isCopyable) {
    return (
      <button onClick={() => handleCopy(value)} className="w-full text-left">
        {itemContent}
      </button>
    );
  }

  return itemContent;
};


export const InformationCards = ({ guests, onEdit, roleConfigs }: InformationCardsProps) => {
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
          <Card key={guest.id} className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={guest.image_url} alt={guest.name} />
                  <AvatarFallback>{guest.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-800">{guest.name}</CardTitle>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onEdit(guest)}>
                <Edit className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex items-center text-sm">
                <span 
                  className="px-2 py-1 rounded-md font-medium"
                  style={getRoleColors(guest.role)}
                >
                  {guest.role}
                </span>
                <span className="text-slate-500 ml-1.5">({guest.id})</span>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <InfoItem icon={Phone} label="SĐT" value={guest.phone} isCopyable />
                <InfoItem icon={Info} label="Thông tin phụ" value={guest.secondaryInfo} isCopyable />
                <InfoItem icon={FileText} label="Tư liệu" value={guest.materials} isCopyable />
                <InfoItem icon={Link} label="Facebook" value={guest.facebook_link} isLink />
                <div className="flex items-start">
                  <Eye className="h-4 w-4 mr-3 mt-1 flex-shrink-0 text-[rgb(185,179,176)]" />
                  <div className="flex justify-between items-center w-full">
                    <p className="text-sm">
                      <span className="text-[rgb(185,179,176)] font-normal">Profile: </span>
                    </p>
                    <Button variant="link" size="sm" className="p-0 h-auto text-sm font-normal" onClick={() => onEdit(guest)}>
                      {guest.profile_content ? "Xem/Sửa" : "Thêm"}
                    </Button>
                  </div>
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