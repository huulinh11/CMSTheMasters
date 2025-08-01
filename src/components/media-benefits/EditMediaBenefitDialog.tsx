import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { MediaVipGuest, NewsItem, NewsVideo, AnyMediaGuest } from "@/types/media-benefit";
import { useState, useEffect } from "react";
import { PlusCircle, Trash2, Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";

type BenefitType = 'pre_event_news' | 'post_event_news' | 'news_video';

interface EditMediaBenefitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  guest: AnyMediaGuest | null;
  benefitType: BenefitType | null;
}

const handleCopy = (textToCopy: string | undefined) => {
  if (!textToCopy) return;
  navigator.clipboard.writeText(textToCopy);
  showSuccess(`Đã sao chép!`);
};

const NewsEditor = ({ items, setItems }: { items: NewsItem[], setItems: (items: NewsItem[]) => void }) => {
  const addNewsItem = () => {
    setItems([...items, { id: crypto.randomUUID(), article_link: "", post_link: "" }]);
  };

  const updateNewsItem = (id: string, field: keyof NewsItem, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeNewsItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id} className="space-y-2 p-3 border rounded-md relative">
          <Label>Bài báo {index + 1}</Label>
          <Input
            placeholder="Link bài viết"
            value={item.article_link}
            onChange={(e) => updateNewsItem(item.id, 'article_link', e.target.value)}
          />
          <Input
            placeholder="Link bài đăng"
            value={item.post_link}
            onChange={(e) => updateNewsItem(item.id, 'post_link', e.target.value)}
          />
          <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => removeNewsItem(item.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button variant="outline" onClick={addNewsItem}>
        <PlusCircle className="mr-2 h-4 w-4" /> Thêm bài báo
      </Button>
    </div>
  );
};

const VideoEditor = ({ video, setVideo }: { video: NewsVideo, setVideo: (video: NewsVideo) => void }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Link kịch bản</Label>
        <Input
          placeholder="Link kịch bản"
          value={video.script_link}
          onChange={(e) => setVideo({ ...video, script_link: e.target.value })}
        />
      </div>
      <div>
        <Label>Link video</Label>
        <Input
          placeholder="Link video"
          value={video.video_link}
          onChange={(e) => setVideo({ ...video, video_link: e.target.value })}
        />
      </div>
    </div>
  );
};

export const EditMediaBenefitDialog = ({ open, onOpenChange, onSave, guest, benefitType }: EditMediaBenefitDialogProps) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [video, setVideo] = useState<NewsVideo>({ script_link: "", video_link: "" });

  useEffect(() => {
    if (guest && benefitType) {
      const benefitData = guest.media_benefit?.[benefitType];
      if (benefitType === 'news_video') {
        setVideo((benefitData as NewsVideo) || { script_link: "", video_link: "" });
      } else {
        setNewsItems((benefitData as NewsItem[]) || []);
      }
    }
  }, [guest, benefitType, open]);

  const handleSave = () => {
    if (benefitType === 'news_video') {
      onSave(video);
    } else {
      onSave(newsItems);
    }
    onOpenChange(false);
  };

  if (!guest || !benefitType) return null;

  const benefitTitles: Record<BenefitType, string> = {
    pre_event_news: "Báo trước sự kiện",
    post_event_news: "Báo sau sự kiện",
    news_video: "Video đưa tin",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{benefitTitles[benefitType]} cho {guest.name}</DialogTitle>
          <DialogDescription>
            {guest.role} - {'secondaryInfo' in guest ? guest.secondaryInfo : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-3">
            <h4 className="font-semibold">Thông tin khách mời</h4>
            <InfoRow label="Tư liệu" value={guest.materials} isCopyable />
            <InfoRow label="Link Facebook" value={'facebook_link' in guest ? guest.facebook_link : undefined} isLink />
            <InfoRow label="Thông tin phụ" value={'secondaryInfo' in guest ? guest.secondaryInfo : undefined} isCopyable />
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">Cập nhật quyền lợi</h4>
            {benefitType === 'news_video' ? (
              <VideoEditor video={video} setVideo={setVideo} />
            ) : (
              <NewsEditor items={newsItems} setItems={setNewsItems} />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSave}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InfoRow = ({ label, value, isLink = false, isCopyable = false }: { label: string, value?: string | null, isLink?: boolean, isCopyable?: boolean }) => {
  if (!value) return <p className="text-sm text-slate-500">{label}: (trống)</p>;
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        {isLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate flex-1">
            {value}
          </a>
        ) : (
          <p className="text-sm text-slate-800 bg-slate-50 p-2 rounded-md flex-1 break-all">{value}</p>
        )}
        {isCopyable && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(value)}>
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};