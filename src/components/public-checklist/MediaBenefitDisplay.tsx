import { MediaBenefit } from "@/types/media-benefit";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";

const LinkWithCopy = ({ link }: { link: string }) => {
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(link);
    showSuccess("Đã sao chép link!");
  };

  return (
    <div className="flex items-center gap-2">
      <a href={link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Link</a>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
};

const getBenefitStatusAndData = (benefitName: string, mediaBenefit: MediaBenefit | null): { status: 'filled' | 'empty', content: React.ReactNode } => {
  if (!mediaBenefit) return { status: 'empty', content: 'Trống' };

  switch (benefitName) {
    case "Thư mời":
      const status = mediaBenefit.invitation_status;
      if (status === 'Đã gửi') {
        return {
          status: 'filled',
          content: 'Đã gửi',
        };
      }
      return {
        status: 'empty',
        content: 'Trống',
      };
    case "Post bài page":
      return {
        status: !!mediaBenefit.page_post_link ? 'filled' : 'empty',
        content: mediaBenefit.page_post_link ? <LinkWithCopy link={mediaBenefit.page_post_link} /> : 'Trống',
      };
    case "Báo trước sự kiện":
    case "Báo sau sự kiện":
      const newsItems = benefitName === "Báo trước sự kiện" ? mediaBenefit.pre_event_news : mediaBenefit.post_event_news;
      const finalLinks = (newsItems || []).map(item => item.post_link).filter(Boolean) as string[];
      if (finalLinks.length > 0) {
        return {
          status: 'filled',
          content: <div className="flex flex-col items-end gap-1">{finalLinks.map((link, i) => <LinkWithCopy key={i} link={link} />)}</div>
        };
      }
      return { status: 'empty', content: 'Trống' };
    case "Video thảm đỏ":
       return {
        status: !!mediaBenefit.red_carpet_video_link ? 'filled' : 'empty',
        content: mediaBenefit.red_carpet_video_link ? <LinkWithCopy link={mediaBenefit.red_carpet_video_link} /> : 'Trống',
      };
    case "Video đưa tin":
      const finalVideoLink = mediaBenefit.news_video?.video_link;
      if (finalVideoLink) {
        return {
          status: 'filled',
          content: <LinkWithCopy link={finalVideoLink} />
        };
      }
      return { status: 'empty', content: 'Trống' };
    case "Bộ ảnh Beauty AI":
      return {
        status: !!mediaBenefit.beauty_ai_photos_link ? 'filled' : 'empty',
        content: mediaBenefit.beauty_ai_photos_link ? <LinkWithCopy link={mediaBenefit.beauty_ai_photos_link} /> : 'Trống',
      };
    default:
      return { status: 'empty', content: 'N/A' };
  }
};

interface MediaBenefitDisplayProps {
  benefits: string[];
  mediaBenefitData: MediaBenefit | null;
}

export const MediaBenefitDisplay = ({ benefits, mediaBenefitData }: MediaBenefitDisplayProps) => {
  const filteredBenefits = benefits.filter(b => b !== "Post bài BTC");

  return (
    <div className="space-y-3">
      {filteredBenefits.map(benefitName => {
        const { status, content } = getBenefitStatusAndData(benefitName, mediaBenefitData);
        const isFilled = status === 'filled';

        return (
          <Card key={benefitName}>
            <CardContent className="p-3 flex justify-between items-center">
              <span className={cn("font-medium", !isFilled ? "text-primary" : "text-slate-800")}>
                {benefitName}
              </span>
              <div className={cn("font-semibold text-right", !isFilled ? "text-primary" : "text-slate-500")}>
                {content}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};