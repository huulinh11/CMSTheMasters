import { Button } from "@/components/ui/button";
import { PlusCircle, Link as LinkIcon, Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { NewsItem, NewsVideo } from "@/types/media-benefit";
import React from "react";

// For simple link fields
export const LinkDisplay = ({ link, onClick }: { link?: string | null, onClick: () => void }) => {
  return (
    <button onClick={onClick} className="w-full h-full flex items-center justify-between p-2 -m-2 min-h-[40px]">
      <div className="flex items-center gap-1">
        {link && (
          <>
            <a href={link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:underline text-sm font-medium">
              Link
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(link);
                showSuccess("Đã sao chép link!");
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
      <PlusCircle className="h-4 w-4 text-slate-500 flex-shrink-0" />
    </button>
  );
};

const FinalLinkItem = ({ link }: { link: string }) => (
  <div className="flex items-center gap-1">
    <a href={link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:underline text-sm font-medium">
      Link
    </a>
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(link);
        showSuccess("Đã sao chép link!");
      }}
    >
      <Copy className="h-3 w-3" />
    </Button>
  </div>
);

// For complex fields
interface ComplexBenefitDisplayProps {
  data: NewsItem[] | NewsVideo | null | undefined;
  benefitType: 'pre_event_news' | 'post_event_news' | 'news_video';
  onClick: () => void;
}

export const ComplexBenefitDisplay = ({ data, benefitType, onClick }: ComplexBenefitDisplayProps) => {
  let hasDraftLink = false;
  let finalLinks: string[] = [];

  if (benefitType === 'news_video') {
    const videoData = data as NewsVideo;
    if (videoData?.script_link) hasDraftLink = true;
    if (videoData?.video_link) finalLinks.push(videoData.video_link);
  } else {
    const newsData = data as NewsItem[];
    if (newsData?.length > 0) {
      if (newsData.some(item => item.article_link)) hasDraftLink = true;
      newsData.forEach(item => {
        if (item.post_link) finalLinks.push(item.post_link);
      });
    }
  }

  return (
    <button onClick={onClick} className="w-full h-full flex items-center justify-between p-2 -m-2 min-h-[40px]">
      <div className="flex flex-col items-start gap-1">
        {hasDraftLink && (
          <span className="bg-slate-100 text-slate-800 text-xs font-medium px-2 py-1 rounded-md">
            Bài
          </span>
        )}
        
        {finalLinks.map((link, index) => (
          <FinalLinkItem key={index} link={link} />
        ))}
      </div>
      <PlusCircle className="h-4 w-4 text-slate-500 flex-shrink-0" />
    </button>
  );
};