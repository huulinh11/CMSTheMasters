import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MediaVipGuest, MediaBenefit } from "@/types/media-benefit";
import { StatusSelect } from "./StatusSelect";
import { SimpleLinkDisplay, ComplexBenefitDisplay } from "./BenefitDisplays";
import { BenefitItem } from "@/types/benefit-configuration";

interface VipMediaBenefitsTableProps {
  guests: MediaVipGuest[];
  onUpdateBenefit: (guestId: string, field: string, value: any) => void;
  onEdit: (guest: MediaVipGuest) => void;
  benefitsToDisplay: BenefitItem[];
}

const getBenefitValue = (benefitName: keyof MediaBenefit | string, mediaBenefit?: MediaBenefit) => {
  if (!mediaBenefit) return null;
  if (benefitName in mediaBenefit) {
    return mediaBenefit[benefitName as keyof MediaBenefit];
  }
  return mediaBenefit.custom_data?.[benefitName] || null;
};

export const VipMediaBenefitsTable = ({ guests, onUpdateBenefit, onEdit, benefitsToDisplay }: VipMediaBenefitsTableProps) => {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Vai trò</TableHead>
            {benefitsToDisplay.map(benefit => (
              <TableHead key={benefit.name}>{benefit.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.length > 0 ? (
            guests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell>{guest.id}</TableCell>
                <TableCell>
                  <Button variant="link" className="p-0 h-auto font-semibold" onClick={() => onEdit(guest)}>
                    {guest.name}
                  </Button>
                </TableCell>
                <TableCell>{guest.role}</TableCell>
                {benefitsToDisplay.map(benefit => (
                  <TableCell key={benefit.name}>
                    {benefit.field_type === 'status_select' && (
                      <StatusSelect
                        value={getBenefitValue('invitation_status', guest.media_benefit) || 'Trống'}
                        onUpdate={(value) => onUpdateBenefit(guest.id, 'invitation_status', value)}
                      />
                    )}
                    {benefit.field_type === 'simple_link' && (
                      <SimpleLinkDisplay link={getBenefitValue(benefit.name, guest.media_benefit)} />
                    )}
                    {(benefit.field_type === 'complex_news' || benefit.field_type === 'complex_video') && (
                      <ComplexBenefitDisplay data={getBenefitValue(benefit.name, guest.media_benefit)} benefitType={benefit.name} />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3 + benefitsToDisplay.length} className="h-24 text-center">
                Không tìm thấy kết quả.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};