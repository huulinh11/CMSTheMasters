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
import { useState, useEffect, useMemo, useRef } from "react";
import { PlusCircle, Trash2, Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { StatusSelect } from "./StatusSelect";
import { BenefitItem } from "@/types/benefit-configuration";
import { benefitNameToFieldMap, standardFields } from "@/config/benefits";

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
    <div className="space-y-2 p-3 border rounded-md">
      <h4 className="font-medium">{title}</h4>
      {items.map((item, index) => (
        <div key={item.id} className="space-y-2 p-3 border rounded-md relative bg-white">
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

const VideoEditor = ({ video, setVideo, title }: { video: NewsVideo, setVideo: (video: NewsVideo) => void, title: string }) => {
  return (
    <div className="space-y-2 p-3 border rounded-md">
      <h4 className="font-medium">{title}</h4>
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

interface EditAllMediaBenefitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (guestId: string, benefits: any) => void;
  guest: AnyMediaGuest | null;
  benefitsByRole: Record<string, string[]>;
  allBenefits: BenefitItem[];
}

export const EditAllMediaBenefitsDialog = ({ open, onOpenChange, onSave, guest, benefitsByRole, allBenefits }: EditAllMediaBenefitsDialogProps) => {
  const [benefits, setBenefits] = useState<Partial<MediaBenefit>>({});
  const guestIdRef = useRef<string | null>(null);

  const benefitsForGuest = useMemo(() => {
    if (!guest) return [];
    const benefitNames = benefitsByRole[guest.role] || [];
    return allBenefits.filter(b => benefitNames.includes(b.name));
  }, [guest, benefitsByRole, allBenefits]);

  useEffect(() => {
    // Only reset the state when the dialog opens for a new guest.
    // This prevents state from being reset on re-renders caused by tab-switching.
    if (open && guest && guest.id !== guestIdRef.current) {
      guestIdRef.current = guest.id;
      const initialBenefits: Partial<MediaBenefit> = guest.media_benefit || {};
      const migratedBenefits: Partial<MediaBenefit> = { ...initialBenefits };
      let customData = { ...(initialBenefits.custom_data || {}) };
      let wasMigrated = false;

      for (const [displayName, fieldName] of Object.entries(benefitNameToFieldMap)) {
        if (customData[displayName] !== undefined && !migratedBenefits[fieldName]) {
          migratedBenefits[fieldName] = customData[displayName];
          delete customData[displayName];
          wasMigrated = true;
        }
      }

      if (wasMigrated) {
        migratedBenefits.custom_data = customData;
      }
      
      setBenefits(migratedBenefits);
    } else if (!open) {
      // Reset when the dialog closes.
      guestIdRef.current = null;
    }
  }, [open, guest]);

  const handleSave = () => {
    if (!guest) return;
    onSave(guest.id, benefits);
  };

  const updateField = (field: keyof MediaBenefit, value: any) => {
    setBenefits(prev => ({ ...prev, [field]: value }));
  };

  const updateCustomField = (field: string, value: any) => {
    setBenefits(prev => ({
      ...prev,
      custom_data: {
        ...prev.custom_data,
        [field]: value,
      }
    }));
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
          {benefitsForGuest.map(benefit => {
            const fieldName = benefitNameToFieldMap[benefit.name] || benefit.name;
            const isStandardField = standardFields.includes(fieldName as any);

            switch (benefit.field_type) {
              case 'status_select':
                return (
                  <div key={benefit.id} className="p-3 border rounded-md space-y-2">
                    <Label>{benefit.name}</Label>
                    <StatusSelect 
                      value={benefits.invitation_status || 'Trống'}
                      onUpdate={(value) => updateField('invitation_status', value)}
                    />
                  </div>
                );
              case 'simple_link':
                return (
                  <InputWithCopy 
                    key={benefit.id}
                    label={benefit.name} 
                    placeholder="Link" 
                    value={(isStandardField ? (benefits[fieldName as keyof MediaBenefit] || '') : (benefits.custom_data?.[fieldName] || '')) ?? ''} 
                    onChange={(e) => {
                      if (isStandardField) {
                        updateField(fieldName as keyof MediaBenefit, e.target.value);
                      } else {
                        updateCustomField(fieldName, e.target.value);
                      }
                    }} 
                  />
                );
              case 'complex_news':
                return (
                  <NewsEditor
                    key={benefit.id}
                    title={benefit.name}
                    items={isStandardField ? (benefits[fieldName as keyof MediaBenefit] || []) : (benefits.custom_data?.[fieldName] || [])}
                    setItems={(items) => {
                      if (isStandardField) {
                        updateField(fieldName as keyof MediaBenefit, items);
                      } else {
                        updateCustomField(fieldName, items);
                      }
                    }}
                  />
                );
              case 'complex_video':
                return (
                  <VideoEditor
                    key={benefit.id}
                    title={benefit.name}
                    video={isStandardField ? (benefits[fieldName as keyof MediaBenefit] || { script_link: '', video_link: '' }) : (benefits.custom_data?.[fieldName] || { script_link: '', video_link: '' })}
                    setVideo={(video) => {
                      if (isStandardField) {
                        updateField(fieldName as keyof MediaBenefit, video);
                      } else {
                        updateCustomField(fieldName, video);
                      }
                    }}
                  />
                );
              default:
                return null;
            }
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSave}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};