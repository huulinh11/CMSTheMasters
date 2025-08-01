import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { NewsItem, NewsVideo } from "@/types/media-benefit";
import React from "react";

const LinkItem = ({ link }: { link: string }) => (
  <div className="flex items-center gap-1">
    <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
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

export const SimpleLinkDisplay = ({ link }: { link?: string | null }) => {
  if (!link) return null;
  return <LinkItem link={link} />;
};

export const ComplexBenefitDisplay = ({ data, benefitType }: { data: any, benefitType: string }) => {
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

  if (!hasDraftLink && finalLinks.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {hasDraftLink && <span className="bg-slate-100 text-slate-800 text-xs font-medium px-2 py-1 rounded-md">Bài</span>}
      {finalLinks.map((link, index) => <LinkItem key={index} link={link} />)}
    </div>
  );
};