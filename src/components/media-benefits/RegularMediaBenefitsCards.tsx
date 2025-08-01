import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaRegularGuest } from "@/types/media-benefit";
import { StatusSelect } from "./StatusSelect";
import { MediaBenefitDisplay, LinkDisplay } from "./MediaBenefitDisplay";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";

interface RegularMediaBenefitsCardsProps {
  guests: MediaRegularGuest[];
  onUpdateBenefit: (guestId: string, field: string, value: any) => void;
  onEditLink: (guest: MediaRegularGuest, field: string) => void;
  onEditComplexBenefit: (guest: MediaRegularGuest, field: string) => void;
}

const handleCopy = (textToCopy: string | undefined) => {
  if (!textToCopy) return;
  navigator.clipboard.writeText(textToCopy);
  showSuccess(`Đã sao chép!`);
};

export const RegularMediaBenefitsCards = ({ guests, onUpdateBenefit, onEditLink, onEditComplexBenefit }: RegularMediaBenefitsCardsProps) => {
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
              {guest.materials && (
                <InfoRow label="Tư liệu">
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(guest.materials)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </InfoRow>
              )}
              {(guest.role === 'VIP' || guest.role === 'V-Vip') && (
                <>
                  <InfoRow label="Báo sau sự kiện">
                    <MediaBenefitDisplay data={guest.media_benefit?.post_event_news} onClick={() => onEditComplexBenefit(guest, 'post_event_news')} benefitType="post_event_news" />
                  </InfoRow>
                  <InfoRow label="Bộ ảnh Beauty AI">
                    <LinkDisplay link={guest.media_benefit?.beauty_ai_photos_link} onClick={() => onEditLink(guest, 'beauty_ai_photos_link')} />
                  </InfoRow>
                </>
              )}
              {guest.role === 'V-Vip' && (
                <InfoRow label="Video thảm đỏ">
                  <LinkDisplay link={guest.media_benefit?.red_carpet_video_link} onClick={() => onEditLink(guest, 'red_carpet_video_link')} />
                </InfoRow>
              )}
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