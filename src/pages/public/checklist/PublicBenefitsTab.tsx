import { useOutletContext } from "react-router-dom";
import { ChecklistDataContext } from "../PublicChecklist";
import { MediaBenefitDisplay } from "@/components/public-checklist/MediaBenefitDisplay";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { SimpleLinkDisplay } from "@/components/media-benefits/BenefitDisplays";

const PublicBenefitsTab = () => {
  const { guest, mediaBenefit, benefitsByRole } = useOutletContext<ChecklistDataContext>();
  const benefitsForRole = benefitsByRole[guest.role] || [];

  const { data: settings } = useQuery({
    queryKey: ['checklist_settings_for_benefits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checklist_settings').select('event_photos_link').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <p className="text-lg">Xin chào: <span className="font-bold">{guest.name}</span></p>
        <p className="text-slate-600">{guest.role}</p>
      </div>
      <h2 className="text-xl font-bold text-slate-800 text-center">Quyền Lợi Của Bạn</h2>
      <MediaBenefitDisplay benefits={benefitsForRole} mediaBenefitData={mediaBenefit} />
      {settings?.event_photos_link && (
        <Card>
          <CardContent className="p-3 flex justify-between items-center">
            <span className="font-medium text-slate-800">
              Hình ảnh sự kiện
            </span>
            <div className="font-semibold text-right text-slate-500">
              <SimpleLinkDisplay link={settings.event_photos_link} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PublicBenefitsTab;