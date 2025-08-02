import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOutletContext } from "react-router-dom";
import { ChecklistDataContext } from "../PublicChecklist";
import { MEDIA_BENEFITS_BY_ROLE } from "@/config/media-benefits-by-role";
import { MediaBenefitDisplay } from "@/components/public-checklist/MediaBenefitDisplay";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TextItem } from "@/types/profile-content";

type ChecklistSettings = {
  logo_url: string;
  title_config: TextItem;
};

const PublicBenefitsTab = () => {
  const { guest, mediaBenefit } = useOutletContext<ChecklistDataContext>();

  const { data: settings, isLoading: isLoadingSettings } = useQuery<ChecklistSettings | null>({
    queryKey: ['checklist_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checklist_settings').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116: no rows found
      return data;
    }
  });

  const benefitsForRole = MEDIA_BENEFITS_BY_ROLE[guest.role] || [];

  if (isLoadingSettings) {
    return <Skeleton className="h-64 w-full" />;
  }

  const titleStyle = settings?.title_config ? {
    fontSize: `${settings.title_config.fontSize}px`,
    color: settings.title_config.color,
    fontWeight: settings.title_config.fontWeight as 'normal' | 'bold',
    fontStyle: settings.title_config.fontStyle as 'normal' | 'italic',
    fontFamily: settings.title_config.fontFamily,
  } : {};

  return (
    <div className="p-4 space-y-4">
      <div className="text-center space-y-3">
        {settings?.logo_url && (
          <img src={settings.logo_url} alt="Event Logo" className="mx-auto h-24 w-auto object-contain" />
        )}
        {settings?.title_config && (
          <h1 style={titleStyle}>{settings.title_config.text}</h1>
        )}
        <p className="text-lg">Xin chào: <span className="font-bold">{guest.name}</span></p>
        <p className="text-slate-600">{guest.role}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quyền Lợi</CardTitle>
        </CardHeader>
        <CardContent>
          <MediaBenefitDisplay benefits={benefitsForRole} mediaBenefitData={mediaBenefit} />
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicBenefitsTab;