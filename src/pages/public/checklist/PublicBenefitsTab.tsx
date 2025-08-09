import { useOutletContext } from "react-router-dom";
import { ChecklistDataContext } from "../PublicChecklist";
import { MEDIA_BENEFITS_BY_ROLE } from "@/config/media-benefits-by-role";
import { MediaBenefitDisplay } from "@/components/public-checklist/MediaBenefitDisplay";

const PublicBenefitsTab = () => {
  const { guest, mediaBenefit } = useOutletContext<ChecklistDataContext>();
  const benefitsForRole = MEDIA_BENEFITS_BY_ROLE[guest.role] || [];

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <p className="text-lg">Xin chào: <span className="font-bold">{guest.name}</span></p>
        <p className="text-slate-600">{guest.role}</p>
      </div>
      <h2 className="text-xl font-bold text-slate-800 text-center">Quyền Lợi Của Bạn</h2>
      <MediaBenefitDisplay benefits={benefitsForRole} mediaBenefitData={mediaBenefit} />
    </div>
  );
};

export default PublicBenefitsTab;