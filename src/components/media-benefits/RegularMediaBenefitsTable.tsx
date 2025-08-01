import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MediaRegularGuest } from "@/types/media-benefit";
import { StatusSelect } from "./StatusSelect";
import { LinkDisplay, ComplexBenefitDisplay } from "./BenefitDisplays";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";

interface RegularMediaBenefitsTableProps {
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

export const RegularMediaBenefitsTable = ({ guests, onUpdateBenefit, onEditLink, onEditComplexBenefit }: RegularMediaBenefitsTableProps) => {
  const hasColumn = (field: string) => guests.some(g => {
    switch(field) {
      case 'materials': return !!g.materials;
      case 'post_event_news': return g.role === 'VIP' || g.role === 'V-Vip';
      case 'beauty_ai_photos_link': return g.role === 'VIP' || g.role === 'V-Vip';
      case 'red_carpet_video_link': return g.role === 'V-Vip';
      default: return false;
    }
  });

  const showMaterials = hasColumn('materials');
  const showPostEventNews = hasColumn('post_event_news');
  const showBeautyAI = hasColumn('beauty_ai_photos_link');
  const showRedCarpet = hasColumn('red_carpet_video_link');

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Thư mời</TableHead>
            {showMaterials && <TableHead>Tư liệu</TableHead>}
            {showPostEventNews && <TableHead>Báo sau sự kiện</TableHead>}
            {showBeautyAI && <TableHead>Bộ ảnh Beauty AI</TableHead>}
            {showRedCarpet && <TableHead>Video thảm đỏ</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.length > 0 ? (
            guests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell>{guest.id}</TableCell>
                <TableCell className="font-semibold">{guest.name}</TableCell>
                <TableCell>{guest.role}</TableCell>
                <TableCell>
                  <StatusSelect
                    value={guest.media_benefit?.invitation_status || 'Trống'}
                    onUpdate={(value) => onUpdateBenefit(guest.id, 'invitation_status', value)}
                  />
                </TableCell>
                {showMaterials && (
                  <TableCell>
                    {guest.materials ? (
                      <Button variant="ghost" size="icon" onClick={() => handleCopy(guest.materials)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </TableCell>
                )}
                {showPostEventNews && (
                  <TableCell>
                    {(guest.role === 'VIP' || guest.role === 'V-Vip') && (
                      <ComplexBenefitDisplay data={guest.media_benefit?.post_event_news} onClick={() => onEditComplexBenefit(guest, 'post_event_news')} benefitType="post_event_news" />
                    )}
                  </TableCell>
                )}
                {showBeautyAI && (
                  <TableCell>
                    {(guest.role === 'VIP' || guest.role === 'V-Vip') && (
                      <LinkDisplay link={guest.media_benefit?.beauty_ai_photos_link} onClick={() => onEditLink(guest, 'beauty_ai_photos_link')} />
                    )}
                  </TableCell>
                )}
                {showRedCarpet && (
                  <TableCell>
                    {guest.role === 'V-Vip' && (
                      <LinkDisplay link={guest.media_benefit?.red_carpet_video_link} onClick={() => onEditLink(guest, 'red_carpet_video_link')} />
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                Không tìm thấy kết quả.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};