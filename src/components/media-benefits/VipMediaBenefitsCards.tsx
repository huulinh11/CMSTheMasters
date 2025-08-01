import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaVipGuest } from "@/types/media-benefit";
import { StatusSelect } from "./StatusSelect";
import { SimpleLinkDisplay, ComplexBenefitDisplay } from "./BenefitDisplays";
import { Separator } from "@/components/ui/separator";

interface VipMediaBenefitsCardsProps {
  guests: MediaVipGuest[];
  onUpdateBenefit: (guestId: string, field: string, value: any) => void;
  onEdit: (guest: MediaVipGuest) => void;
}

export const VipMediaBenefitsCards = ({ guests, onUpdateBenefit, onEdit }: VipMediaBenefitsCardsProps) => {
  return (
    <div className="space-y-4">
      {guests.length > 0 ? (
        guests.map((guest) => (
          <Card key={guest.id} className="bg-white shadow-sm" onClick={() => onEdit(guest)}>
            <CardHeader>
              <CardTitle>{guest.name}</CardTitle>
              <p className="text-sm text-slate-500">{guest.role} ({guest.id})</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Thư mời">
                <StatusSelect
                  value={guest.media_benefit?.invitation_status || 'Trống'}
                  onUpdate={(value) => onUpdateBenefit(guest.id, 'invitation_status', value)}
                />
              </InfoRow>
              <Separator />
              <InfoRow label="Post bài page">
                <SimpleLinkDisplay link={guest.media_benefit?.page_post_link} />
              </InfoRow>
              <InfoRow label="Post bài BTC">
                <SimpleLinkDisplay link={guest.media_benefit?.btc_post_link} />
              </InfoRow>
              <InfoRow label="Báo trước sự kiện">
                <ComplexBenefitDisplay data={guest.media_benefit?.pre_event_news} benefitType="pre_event_news" />
              </InfoRow>
              <InfoRow label="Báo sau sự kiện">
                <ComplexBenefitDisplay data={guest.media_benefit?.post_event_news} benefitType="post_event_news" />
              </InfoRow>
              <InfoRow label="Video thảm đỏ">
                <SimpleLinkDisplay link={guest.media_benefit?.red_carpet_video_link} />
              </InfoRow>
              <InfoRow label="Video đưa tin">
                <ComplexBenefitDisplay data={guest.media_benefit?.news_video} benefitType="news_video" />
              </InfoRow>
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

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-slate-600 font-medium">{label}</span>
    <div>{children}</div>
  </div>
);