import { Skeleton } from "@/components/ui/skeleton";
import { useOutletContext } from "react-router-dom";
import { ChecklistDataContext } from "../PublicChecklist";
import { MEDIA_BENEFITS_BY_ROLE } from "@/config/media-benefits-by-role";
import { MediaBenefitDisplay } from "@/components/public-checklist/MediaBenefitDisplay";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TextItem } from "@/types/profile-content";

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

const PublicBenefitsTab = () => {
  const { guest, mediaBenefit } = useOutletContext<ChecklistDataContext>();

  const { data: settings, isLoading: isLoadingSettings } = useQuery<ChecklistSettings | null>({
    queryKey: ['checklist_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checklist_settings').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const benefitsForRole = MEDIA_BENEFITS_BY_ROLE[guest.role] || [];

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
    <div className="p-4 space-y-4">
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
        <p className="text-slate-600">{guest.role}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 px-2">Quyền Lợi</h2>
        <MediaBenefitDisplay benefits={benefitsForRole} mediaBenefitData={mediaBenefit} />
      </div>
    </div>
  );
};

export default PublicBenefitsTab;