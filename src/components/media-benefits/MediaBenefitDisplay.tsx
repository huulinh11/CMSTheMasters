import { Button } from "@/components/ui/button";
import { PlusCircle, Link as LinkIcon, Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";

interface MediaBenefitDisplayProps {
  data: any;
  benefitType: 'pre_event_news' | 'post_event_news' | 'news_video';
  onClick: () => void;
}

export const MediaBenefitDisplay = ({ data, benefitType, onClick }: MediaBenefitDisplayProps) => {
  let hasContent = false;
  if (benefitType === 'news_video') {
    hasContent = !!data?.script_link;
  } else {
    hasContent = Array.isArray(data) && data.length > 0 && data.some(item => item.article_link);
  }

  return (
    <div className="flex items-center gap-1">
      {hasContent && (
        <Button variant="secondary" size="sm" className="h-7 px-2 text-xs cursor-default pointer-events-none">
          Bài
        </Button>
      )}
      <Button variant="ghost" size="icon" onClick={onClick} className="h-8 w-8">
        <PlusCircle className="h-4 w-4 text-slate-500" />
      </Button>
    </div>
  );
};

export const LinkDisplay = ({ link, onClick }: { link?: string | null, onClick: () => void }) => {
  if (link) {
    return (
      <div className="flex items-center gap-1">
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
          Link
        </a>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.preventDefault();
            navigator.clipboard.writeText(link);
            showSuccess("Đã sao chép link!");
          }}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={onClick} className="h-8 w-8">
      <PlusCircle className="h-4 w-4 text-slate-500" />
    </Button>
  );
};