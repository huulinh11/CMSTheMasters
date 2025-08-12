import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaRegularGuest, MediaBenefit } from "@/types/media-benefit";
import { StatusSelect } from "./StatusSelect";
import { SimpleLinkDisplay, ComplexBenefitDisplay } from "./BenefitDisplays";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { BenefitItem } from "@/types/benefit-configuration";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface RegularMediaBenefitsCardsProps {
  guests: MediaRegularGuest[];
  onUpdateBenefit: (guestId: string, field: string, value: any) => void;
  onEdit: (guest: MediaRegularGuest) => void;
  benefitsByRole: Record<string, string[]>;
  allBenefits: BenefitItem[];
}

const getBenefitValue = (benefitName: keyof MediaBenefit | string, mediaBenefit?: MediaBenefit) => {
  if (!mediaBenefit) return null;
  if (benefitName in mediaBenefit) {
    return mediaBenefit[benefitName as keyof MediaBenefit];
  }
  return mediaBenefit.custom_data?.[benefitName] || null;
};

const BenefitControl = ({ guest, benefit, onUpdateBenefit }: { guest: MediaRegularGuest, benefit: BenefitItem, onUpdateBenefit: RegularMediaBenefitsCardsProps['onUpdateBenefit'] }) => {
  const value = getBenefitValue(benefit.name, guest.media_benefit);

  switch (benefit.field_type) {
    case 'status_select':
      return (
        <StatusSelect
          value={value || 'Trống'}
          onUpdate={(newValue) => onUpdateBenefit(guest.id, 'invitation_status', newValue)}
        />
      );
    case 'simple_link':
      return <SimpleLinkDisplay link={value} />;
    case 'complex_news':
    case 'complex_video':
      return <ComplexBenefitDisplay data={value} benefitType={benefit.name} />;
    default:
      return null;
  }
};

const handleCopy = (textToCopy: string | undefined) => {
  if (!textToCopy) return;
  navigator.clipboard.writeText(textToCopy);
  showSuccess(`Đã sao chép!`);
};

export const RegularMediaBenefitsCards = ({ guests, onUpdateBenefit, onEdit, benefitsByRole, allBenefits }: RegularMediaBenefitsCardsProps) => {
  const allBenefitsMap = useMemo(() => new Map(allBenefits.map(b => [b.name, b])), [allBenefits]);

  return (
    <div className="space-y-4">
      {guests.length > 0 ? (
        guests.map((guest) => {
          const benefitsForRole = (benefitsByRole[guest.role] || [])
            .map(name => allBenefitsMap.get(name))
            .filter((b): b is BenefitItem => !!b);

          return (
            <Card key={guest.id} className="bg-white shadow-sm" onClick={() => onEdit(guest)}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{guest.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{guest.name}</CardTitle>
                    <p className="text-sm text-slate-500">{guest.role} ({guest.id})</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {guest.materials && (
                  <>
                    <InfoRow label="Tư liệu">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleCopy(guest.materials); }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </InfoRow>
                    <Separator />
                  </>
                )}
                {benefitsForRole.map((benefit, index) => (
                  <React.Fragment key={benefit.id}>
                    <InfoRow label={benefit.name}>
                      <BenefitControl guest={guest} benefit={benefit} onUpdateBenefit={onUpdateBenefit} />
                    </InfoRow>
                    {index < benefitsForRole.length - 1 && <Separator />}
                  </React.Fragment>
                ))}
              </CardContent>
            </Card>
          );
        })
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