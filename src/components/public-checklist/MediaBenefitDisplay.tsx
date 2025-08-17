import { MediaBenefit, NewsItem, NewsVideo } from "@/types/media-benefit";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { benefitNameToFieldMap } from "@/config/benefits";

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

  const fieldName = benefitNameToFieldMap[benefitName];
  let value: any = null;

  if (fieldName && mediaBenefit[fieldName as keyof MediaBenefit]) {
    value = mediaBenefit[fieldName as keyof MediaBenefit];
  } else if (mediaBenefit.custom_data?.[benefitName]) {
    value = mediaBenefit.custom_data[benefitName];
  }

  if (!value) return { status: 'empty', content: 'Trống' };

  switch (benefitName) {
    case "Thư mời":
      if (value === 'Đã gửi') {
        return { status: 'filled', content: 'Đã gửi' };
      }
      return { status: 'empty', content: 'Trống' };

    case "Post bài page":
    case "Video thảm đỏ":
    case "Bộ ảnh Beauty AI":
      if (typeof value === 'string' && value) {
        return { status: 'filled', content: <LinkWithCopy link={value} /> };
      }
      return { status: 'empty', content: 'Trống' };

    case "Báo trước sự kiện":
    case "Báo sau sự kiện":
      const newsItems = value as NewsItem[];
      const finalLinks = (newsItems || []).map(item => item.post_link).filter(Boolean) as string[];
      if (finalLinks.length > 0) {
        return {
          status: 'filled',
          content: <div className="flex flex-col items-end gap-1">{finalLinks.map((link, i) => <LinkWithCopy key={i} link={link} />)}</div>
        };
      }
      return { status: 'empty', content: 'Trống' };

    case "Video đưa tin":
      const finalVideoLink = (value as NewsVideo)?.video_link;
      if (finalVideoLink) {
        return {
          status: 'filled',
          content: <LinkWithCopy link={finalVideoLink} />
        };
      }
      return { status: 'empty', content: 'Trống' };

    default:
      if (typeof value === 'string' && value) {
        return { status: 'filled', content: <LinkWithCopy link={value} /> };
      }
      return { status: 'empty', content: 'Trống' };
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