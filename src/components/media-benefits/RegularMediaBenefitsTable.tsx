import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MediaRegularGuest, MediaBenefit } from "@/types/media-benefit";
import { StatusSelect } from "./StatusSelect";
import { SimpleLinkDisplay, ComplexBenefitDisplay } from "./BenefitDisplays";
import { Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { BenefitItem } from "@/types/benefit-configuration";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { benefitNameToFieldMap } from "@/config/benefits";

interface RegularMediaBenefitsTableProps {
  guests: MediaRegularGuest[];
  onUpdateBenefit: (guestId: string, field: string, value: any) => void;
  onEdit: (guest: MediaRegularGuest) => void;
  benefitsToDisplay: BenefitItem[];
}

const handleCopy = (textToCopy: string | undefined) => {
  if (!textToCopy) return;
  navigator.clipboard.writeText(textToCopy);
  showSuccess(`Đã sao chép!`);
};

const getBenefitValue = (benefitName: string, mediaBenefit?: MediaBenefit) => {
  if (!mediaBenefit) return null;
  const fieldName = benefitNameToFieldMap[benefitName];
  
  if (fieldName && mediaBenefit[fieldName as keyof MediaBenefit]) {
    return mediaBenefit[fieldName as keyof MediaBenefit];
  }
  
  return mediaBenefit.custom_data?.[benefitName] || null;
};

export const RegularMediaBenefitsTable = ({ guests, onUpdateBenefit, onEdit, benefitsToDisplay }: RegularMediaBenefitsTableProps) => {
  
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ảnh</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Tư liệu</TableHead>
            {benefitsToDisplay.map(benefit => (
              <TableHead key={benefit.name}>{benefit.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.length > 0 ? (
            guests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell>
                  <Avatar>
                    <AvatarFallback>{guest.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>{guest.id}</TableCell>
                <TableCell>
                  <Button variant="link" className="p-0 h-auto font-semibold" onClick={() => onEdit(guest)}>
                    {guest.name}
                  </Button>
                </TableCell>
                <TableCell>{guest.role}</TableCell>
                <TableCell>
                  {guest.materials ? (
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(guest.materials)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  ) : null}
                </TableCell>
                {benefitsToDisplay.map(benefit => (
                  <TableCell key={benefit.name}>
                    {benefit.field_type === 'status_select' && (
                      <StatusSelect
                        value={getBenefitValue('Thư mời', guest.media_benefit) || 'Trống'}
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
              <TableCell colSpan={5 + benefitsToDisplay.length} className="h-24 text-center">
                Không tìm thấy kết quả.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};