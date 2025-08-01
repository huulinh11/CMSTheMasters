import { Button } from "@/components/ui/button";
import { PlusCircle, Link as LinkIcon, Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { NewsItem, NewsVideo } from "@/types/media-benefit";
import React from "react";

// For simple link fields
export const LinkDisplay = ({ link, onClick }: { link?: string | null, onClick: () => void }) => {
  return (
    <button onClick={onClick} className="w-full h-full flex items-center justify-start p-2 -m-2">
      {link ? (
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
      ) : (
        <PlusCircle className="h-4 w-4 text-slate-500" />
      )}
    </button>
  );
};

const LinkItem = ({ link }: { link: string }) => (
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
  const renderContent = () => {
    if (!data) {
      return <PlusCircle className="h-4 w-4 text-slate-500" />;
    }

    if (benefitType === 'news_video') {
      const videoData = data as NewsVideo;
      if (!videoData.script_link && !videoData.video_link) {
        return <PlusCircle className="h-4 w-4 text-slate-500" />;
      }
      return (
        <div className="flex flex-col gap-1 items-start">
          {videoData.script_link && <LinkItem link={videoData.script_link} />}
          {videoData.video_link && <LinkItem link={videoData.video_link} />}
        </div>
      );
    }

    const newsData = data as NewsItem[];
    if (newsData.length === 0 || newsData.every(item => !item.article_link && !item.post_link)) {
      return <PlusCircle className="h-4 w-4 text-slate-500" />;
    }

    return (
      <div className="flex flex-col gap-1 items-start">
        {newsData.map((item, index) => (
          <React.Fragment key={item.id || index}>
            {item.article_link && <LinkItem link={item.article_link} />}
            {item.post_link && <LinkItem link={item.post_link} />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <button onClick={onClick} className="w-full h-full flex items-start p-2 -m-2">
      {renderContent()}
    </button>
  );
};