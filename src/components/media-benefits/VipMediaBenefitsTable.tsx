import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MediaVipGuest } from "@/types/media-benefit";
import { StatusSelect } from "./StatusSelect";
import { SimpleLinkDisplay, ComplexBenefitDisplay } from "./BenefitDisplays";

interface VipMediaBenefitsTableProps {
  guests: MediaVipGuest[];
  onUpdateBenefit: (guestId: string, field: string, value: any) => void;
  onEdit: (guest: MediaVipGuest) => void;
}

export const VipMediaBenefitsTable = ({ guests, onUpdateBenefit, onEdit }: VipMediaBenefitsTableProps) => {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Thư mời</TableHead>
            <TableHead>Post bài page</TableHead>
            <TableHead>Post bài BTC</TableHead>
            <TableHead>Báo trước sự kiện</TableHead>
            <TableHead>Báo sau sự kiện</TableHead>
            <TableHead>Video thảm đỏ</TableHead>
            <TableHead>Video đưa tin</TableHead>
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
                <TableCell>
                  <StatusSelect
                    value={guest.media_benefit?.invitation_status || 'Trống'}
                    onUpdate={(value) => onUpdateBenefit(guest.id, 'invitation_status', value)}
                  />
                </TableCell>
                <TableCell>
                  <SimpleLinkDisplay link={guest.media_benefit?.page_post_link} />
                </TableCell>
                <TableCell>
                  <SimpleLinkDisplay link={guest.media_benefit?.btc_post_link} />
                </TableCell>
                <TableCell>
                  <ComplexBenefitDisplay data={guest.media_benefit?.pre_event_news} benefitType="pre_event_news" />
                </TableCell>
                <TableCell>
                  <ComplexBenefitDisplay data={guest.media_benefit?.post_event_news} benefitType="post_event_news" />
                </TableCell>
                <TableCell>
                  <SimpleLinkDisplay link={guest.media_benefit?.red_carpet_video_link} />
                </TableCell>
                <TableCell>
                  <ComplexBenefitDisplay data={guest.media_benefit?.news_video} benefitType="news_video" />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center">
                Không tìm thấy kết quả.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};