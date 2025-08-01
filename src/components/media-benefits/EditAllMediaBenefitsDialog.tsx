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
import { AnyMediaGuest, NewsItem, NewsVideo, MediaBenefit } from "@/types/media-benefit";
import { useState, useEffect } from "react";
import { PlusCircle, Trash2, Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { StatusSelect } from "./StatusSelect";

interface EditAllMediaBenefitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (guestId: string, benefits: any) => void;
  guest: AnyMediaGuest | null;
}

const InputWithCopy = ({ value, onChange, placeholder, label }: { value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string, label: string }) => {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative mt-1">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
          onClick={() => {
            if(value) {
              navigator.clipboard.writeText(value);
              showSuccess("Đã sao chép!");
            }
          }}
          disabled={!value}
        >
          <Copy className="h-4 w-4 text-slate-500" />
        </Button>
      </div>
    </div>
  );
};

const NewsEditor = ({ items, setItems, title }: { items: NewsItem[], setItems: (items: NewsItem[]) => void, title: string }) => {
  const addNewsItem = () => {
    setItems([...items, { id: crypto.randomUUID(), article_link: "", post_link: "" }]);
  };

  const updateNewsItem = (id: string, field: keyof Omit<NewsItem, 'id'>, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeNewsItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-2">
      <h4 className="font-medium">{title}</h4>
      {items.map((item, index) => (
        <div key={item.id} className="space-y-2 p-3 border rounded-md relative">
          <Label className="text-xs text-slate-500">Bài {index + 1}</Label>
          <InputWithCopy
            placeholder="Link nháp"
            label="Link nháp"
            value={item.article_link}
            onChange={(e) => updateNewsItem(item.id, 'article_link', e.target.value)}
          />
          <InputWithCopy
            placeholder="Link final"
            label="Link final"
            value={item.post_link}
            onChange={(e) => updateNewsItem(item.id, 'post_link', e.target.value)}
          />
          <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => removeNewsItem(item.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addNewsItem}>
        <PlusCircle className="mr-2 h-4 w-4" /> Thêm bài
      </Button>
    </div>
  );
};

const VideoEditor = ({ video, setVideo }: { video: NewsVideo, setVideo: (video: NewsVideo) => void }) => {
  return (
    <div className="space-y-2">
      <h4 className="font-medium">Video đưa tin</h4>
      <InputWithCopy
        label="Link nháp"
        placeholder="Link nháp"
        value={video.script_link}
        onChange={(e) => setVideo({ ...video, script_link: e.target.value })}
      />
      <InputWithCopy
        label="Link final"
        placeholder="Link final"
        value={video.video_link}
        onChange={(e) => setVideo({ ...video, video_link: e.target.value })}
      />
    </div>
  );
};

export const EditAllMediaBenefitsDialog = ({ open, onOpenChange, onSave, guest }: EditAllMediaBenefitsDialogProps) => {
  const [benefits, setBenefits] = useState<Partial<MediaBenefit>>({});

  useEffect(() => {
    if (guest) {
      setBenefits(guest.media_benefit || {});
    }
  }, [guest, open]);

  const handleSave = () => {
    if (!guest) return;
    onSave(guest.id, benefits);
  };

  const updateField = (field: keyof MediaBenefit, value: any) => {
    setBenefits(prev => ({ ...prev, [field]: value }));
  };

  if (!guest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa quyền lợi cho {guest.name}</DialogTitle>
          <DialogDescription>
            ID: {guest.id} | Vai trò: {guest.role}
            {'secondaryInfo' in guest && guest.secondaryInfo && ` | ${guest.secondaryInfo}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
          <div className="p-3 border rounded-md space-y-2">
            <Label>Thư mời</Label>
            <StatusSelect 
              value={benefits.invitation_status || 'Trống'}
              onUpdate={(value) => updateField('invitation_status', value)}
            />
          </div>

          {'secondaryInfo' in guest && ( // VIP Guest
            <>
              <InputWithCopy label="Post bài page" placeholder="Link post" value={benefits.page_post_link || ''} onChange={(e) => updateField('page_post_link', e.target.value)} />
              <InputWithCopy label="Post bài BTC" placeholder="Link post" value={benefits.btc_post_link || ''} onChange={(e) => updateField('btc_post_link', e.target.value)} />
              <NewsEditor title="Báo trước sự kiện" items={benefits.pre_event_news || []} setItems={(items) => updateField('pre_event_news', items)} />
              <NewsEditor title="Báo sau sự kiện" items={benefits.post_event_news || []} setItems={(items) => updateField('post_event_news', items)} />
              <InputWithCopy label="Video thảm đỏ" placeholder="Link video" value={benefits.red_carpet_video_link || ''} onChange={(e) => updateField('red_carpet_video_link', e.target.value)} />
              <VideoEditor video={benefits.news_video || { script_link: '', video_link: '' }} setVideo={(video) => updateField('news_video', video)} />
            </>
          )}

          {'materials' in guest && ( // Regular Guest
            <>
              {(guest.role === 'VIP' || guest.role === 'V-Vip') && (
                <>
                  <NewsEditor title="Báo sau sự kiện" items={benefits.post_event_news || []} setItems={(items) => updateField('post_event_news', items)} />
                  <InputWithCopy label="Bộ ảnh Beauty AI" placeholder="Link ảnh" value={benefits.beauty_ai_photos_link || ''} onChange={(e) => updateField('beauty_ai_photos_link', e.target.value)} />
                </>
              )}
              {guest.role === 'V-Vip' && (
                <InputWithCopy label="Video thảm đỏ" placeholder="Link video" value={benefits.red_carpet_video_link || ''} onChange={(e) => updateField('red_carpet_video_link', e.target.value)} />
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSave}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};