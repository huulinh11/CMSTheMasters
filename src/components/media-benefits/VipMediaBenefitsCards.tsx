import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaVipGuest } from "@/types/media-benefit";
import { StatusSelect } from "./StatusSelect";
import { MediaBenefitDisplay, LinkDisplay } from "./MediaBenefitDisplay";
import { Separator } from "@/components/ui/separator";

interface VipMediaBenefitsCardsProps {
  guests: MediaVipGuest[];
  onUpdateBenefit: (guestId: string, field: string, value: any) => void;
  onEditLink: (guest: MediaVipGuest, field: string) => void;
  onEditComplexBenefit: (guest: MediaVipGuest, field: string) => void;
}

export const VipMediaBenefitsCards = ({ guests, onUpdateBenefit, onEditLink, onEditComplexBenefit }: VipMediaBenefitsCardsProps) => {
  return (
    <div className="space-y-4">
      {guests.length > 0 ? (
        guests.map((guest) => (
          <Card key={guest.id} className="bg-white shadow-sm">
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
                <LinkDisplay link={guest.media_benefit?.page_post_link} onClick={() => onEditLink(guest, 'page_post_link')} />
              </InfoRow>
              <InfoRow label="Post bài BTC">
                <LinkDisplay link={guest.media_benefit?.btc_post_link} onClick={() => onEditLink(guest, 'btc_post_link')} />
              </InfoRow>
              <InfoRow label="Báo trước sự kiện">
                <MediaBenefitDisplay data={guest.media_benefit?.pre_event_news} onClick={() => onEditComplexBenefit(guest, 'pre_event_news')} label="Chi tiết" />
              </InfoRow>
              <InfoRow label="Báo sau sự kiện">
                <MediaBenefitDisplay data={guest.media_benefit?.post_event_news} onClick={() => onEditComplexBenefit(guest, 'post_event_news')} label="Chi tiết" />
              </InfoRow>
              <InfoRow label="Video thảm đỏ">
                <LinkDisplay link={guest.media_benefit?.red_carpet_video_link} onClick={() => onEditLink(guest, 'red_carpet_video_link')} />
              </InfoRow>
              <InfoRow label="Video đưa tin">
                <MediaBenefitDisplay data={guest.media_benefit?.news_video} onClick={() => onEditComplexBenefit(guest, 'news_video')} label="Chi tiết" />
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