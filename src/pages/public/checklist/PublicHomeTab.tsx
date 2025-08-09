import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useOutletContext, Link } from "react-router-dom";
import { ChecklistDataContext } from "../PublicChecklist";
import { TextItem } from "@/types/profile-content";
import { GuestQrCode } from "@/components/public-checklist/GuestQrCode";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, ClipboardList, Megaphone, Info, FileText, Users } from "lucide-react";
import { MaterialsViewerDialog } from "@/components/public-checklist/MaterialsViewerDialog";
import { ReferredGuestsDialog } from "@/components/public-checklist/ReferredGuestsDialog";

type LogoConfig = {
  imageUrl: string;
  width: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
};

type ChecklistSettings = {
  logo_config: Partial<LogoConfig>;
  title_config: Partial<TextItem>;
};

const PublicHomeTab = () => {
  const { guest } = useOutletContext<ChecklistDataContext>();
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [isReferredGuestsOpen, setIsReferredGuestsOpen] = useState(false);

  const { data: settings, isLoading: isLoadingSettings } = useQuery<ChecklistSettings | null>({
    queryKey: ['checklist_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checklist_settings').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const { data: referredGuests } = useQuery({
    queryKey: ['referred_guests', guest.name],
    queryFn: async () => {
      if (!guest.name) return [];
      const { data: vips, error: vipsError } = await supabase.from('vip_guests').select('id, name, role, type: "Chức vụ"').eq('referrer', guest.name);
      if (vipsError) throw vipsError;
      const { data: regulars, error: regularsError } = await supabase.from('guests').select('id, name, role, type: "Khách mời"').eq('referrer', guest.name);
      if (regularsError) throw regularsError;
      return [...(vips || []), ...(regulars || [])];
    },
    enabled: !!guest.name,
  });

  if (isLoadingSettings) {
    return <Skeleton className="h-64 w-full" />;
  }

  const titleStyle = settings?.title_config ? {
    fontSize: `${settings.title_config.fontSize || 24}px`,
    color: settings.title_config.color || '#000000',
    fontWeight: (settings.title_config.fontWeight as 'normal' | 'bold') || 'bold',
    fontStyle: (settings.title_config.fontStyle as 'normal' | 'italic') || 'normal',
    fontFamily: settings.title_config.fontFamily || 'sans-serif',
    marginTop: `${settings.title_config.marginTop || 0}px`,
    marginRight: `${settings.title_config.marginRight || 0}px`,
    marginBottom: `${settings.title_config.marginBottom || 0}px`,
    marginLeft: `${settings.title_config.marginLeft || 0}px`,
  } : {};

  const logoConfig = settings?.logo_config;

  return (
    <>
      <div className="p-4 space-y-6">
        <div className="text-center space-y-3">
          {logoConfig?.imageUrl && (
            <div style={{
              marginTop: `${logoConfig.marginTop || 0}px`,
              marginRight: `${logoConfig.marginRight || 0}px`,
              marginBottom: `${logoConfig.marginBottom || 0}px`,
              marginLeft: `${logoConfig.marginLeft || 0}px`,
            }}>
              <img 
                src={logoConfig.imageUrl} 
                alt="Event Logo" 
                className="mx-auto h-auto object-contain"
                style={{ width: `${logoConfig.width || 100}%` }}
              />
            </div>
          )}
          {settings?.title_config?.text && (
            <h1 style={titleStyle}>{settings.title_config.text}</h1>
          )}
          <p className="text-lg">Xin chào: <span className="font-bold">{guest.name}</span></p>
          <p className="text-slate-600">{guest.role} ({guest.id})</p>
        </div>

        <GuestQrCode guestId={guest.id} guestName={guest.name} />

        <Separator />

        <div className="space-y-3">
          <Link to="../event-info">
            <Button className="w-full justify-start h-14 text-base">
              <Calendar className="mr-4 h-6 w-6" /> Xem Timeline & Thông tin sự kiện
            </Button>
          </Link>
          <Link to="../tasks">
            <Button className="w-full justify-start h-14 text-base">
              <ClipboardList className="mr-4 h-6 w-6" /> Xem tác vụ
            </Button>
          </Link>
          <Link to="../benefits">
            <Button className="w-full justify-start h-14 text-base">
              <Megaphone className="mr-4 h-6 w-6" /> Xem quyền lợi của bạn
            </Button>
          </Link>
        </div>

        <Separator />

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Thông tin khác của bạn</h2>
          <div className="space-y-2 text-sm">
            {guest.secondaryInfo && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center"><Info className="mr-2 h-4 w-4" /> Thông tin phụ</span>
                <span className="font-medium">{guest.secondaryInfo}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center"><FileText className="mr-2 h-4 w-4" /> Tư liệu</span>
              <Button variant="link" className="p-0 h-auto" onClick={() => setIsMaterialsOpen(true)}>
                Xem & Sửa
              </Button>
            </div>
          </div>
        </div>
        
        {referredGuests && referredGuests.length > 0 && (
          <>
            <Separator />
            <Button className="w-full h-14 text-base" onClick={() => setIsReferredGuestsOpen(true)}>
              <Users className="mr-4 h-6 w-6" /> Xem thành viên ({referredGuests.length})
            </Button>
          </>
        )}
      </div>
      <MaterialsViewerDialog
        open={isMaterialsOpen}
        onOpenChange={setIsMaterialsOpen}
        guest={guest}
      />
      {referredGuests && referredGuests.length > 0 && (
        <ReferredGuestsDialog
          open={isReferredGuestsOpen}
          onOpenChange={setIsReferredGuestsOpen}
          referrerName={guest.name}
          referredGuests={referredGuests}
        />
      )}
    </>
  );
};

export default PublicHomeTab;