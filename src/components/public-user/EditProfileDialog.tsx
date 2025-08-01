import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Trash2, GripVertical, Image as ImageIcon, Video, Type } from "lucide-react";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { ContentBlock } from "@/types/profile-content";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from "@dnd-kit/utilities";
import { v4 as uuidv4 } from 'uuid';
import { getVideoEmbedUrl } from "@/lib/video";
import { ImageUploader } from "./ImageUploader";

type CombinedGuest = (VipGuest | Guest) & { type: 'Chức vụ' | 'Khách mời' };

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: CombinedGuest | null;
  onSave: (content: ContentBlock[]) => void;
  isSaving: boolean;
}

const SortableBlock = ({ block, children }: { block: ContentBlock, children: React.ReactNode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 p-4 border rounded-lg bg-slate-50">
      <div {...attributes} {...listeners} className="cursor-grab touch-none p-2">
        <GripVertical className="h-5 w-5 text-slate-400" />
      </div>
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
};

export const EditProfileDialog = ({ open, onOpenChange, guest, onSave, isSaving }: EditProfileDialogProps) => {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  useEffect(() => {
    if (guest) {
      setBlocks(Array.isArray(guest.profile_content) ? guest.profile_content : []);
    }
  }, [guest]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAddBlock = (type: 'image' | 'video' | 'text') => {
    let newBlock: ContentBlock;
    const base = { id: uuidv4() };
    if (type === 'image') {
      newBlock = { ...base, type: 'image', imageUrl: '', linkUrl: '' };
    } else if (type === 'video') {
      newBlock = { ...base, type: 'video', videoUrl: '', isVertical: false };
    } else {
      newBlock = { ...base, type: 'text', text: '', backgroundImageUrl: '', isGuestName: false };
    }
    setBlocks(prev => [...prev, newBlock]);
  };

  const handleUpdateBlock = (id: string, field: string, value: any) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      setBlocks(arrayMove(blocks, oldIndex, newIndex));
    }
  }

  if (!guest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Profile: {guest.name}</DialogTitle>
          <DialogDescription>Thêm, xóa, và sắp xếp các khối nội dung cho trang public.</DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden flex flex-col">
          <ScrollArea className="flex-grow pr-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {blocks.map(block => (
                    <SortableBlock key={block.id} block={block}>
                      <div className="space-y-2 w-full">
                        <div className="flex justify-between items-center">
                          <Label className="font-semibold capitalize text-slate-600">{block.type}</Label>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteBlock(block.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        {block.type === 'image' && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Input placeholder="Link ảnh" value={block.imageUrl} onChange={e => handleUpdateBlock(block.id, 'imageUrl', e.target.value)} />
                              <ImageUploader guestId={guest.id} onUploadSuccess={url => handleUpdateBlock(block.id, 'imageUrl', url)} />
                            </div>
                            <Input placeholder="Link khi click vào ảnh (tùy chọn)" value={block.linkUrl} onChange={e => handleUpdateBlock(block.id, 'linkUrl', e.target.value)} />
                            {block.imageUrl && <img src={block.imageUrl} alt="Preview" className="rounded-md border max-h-48 object-contain" />}
                          </div>
                        )}
                        {block.type === 'video' && (
                          <div className="space-y-2">
                            <Input placeholder="Link Youtube" value={block.videoUrl} onChange={e => handleUpdateBlock(block.id, 'videoUrl', e.target.value)} />
                            <div className="flex items-center space-x-2">
                              <Switch id={`isVertical-${block.id}`} checked={block.isVertical} onCheckedChange={checked => handleUpdateBlock(block.id, 'isVertical', checked)} />
                              <Label htmlFor={`isVertical-${block.id}`}>Video dọc (9:16)</Label>
                            </div>
                            {getVideoEmbedUrl(block.videoUrl) && (
                              <div className={block.isVertical ? 'aspect-w-9 aspect-h-16' : 'aspect-w-16 aspect-h-9'}>
                                <iframe src={getVideoEmbedUrl(block.videoUrl)!} title="Video Preview" className="w-full h-full rounded-md border" allowFullScreen />
                              </div>
                            )}
                          </div>
                        )}
                        {block.type === 'text' && (
                          <div className="space-y-2">
                            <Textarea placeholder="Nội dung text" value={block.text} onChange={e => handleUpdateBlock(block.id, 'text', e.target.value)} />
                            <div className="flex items-center gap-2">
                              <Input placeholder="Link ảnh nền (tùy chọn)" value={block.backgroundImageUrl} onChange={e => handleUpdateBlock(block.id, 'backgroundImageUrl', e.target.value)} />
                              <ImageUploader guestId={guest.id} onUploadSuccess={url => handleUpdateBlock(block.id, 'backgroundImageUrl', url)} />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch id={`isGuestName-${block.id}`} checked={block.isGuestName} onCheckedChange={checked => handleUpdateBlock(block.id, 'isGuestName', checked)} />
                              <Label htmlFor={`isGuestName-${block.id}`}>Tự động lấy tên khách mời</Label>
                            </div>
                            <div className="h-32 rounded-md border bg-cover bg-center flex items-center justify-center p-2" style={{ backgroundImage: `url(${block.backgroundImageUrl})` }}>
                              <p className="text-xl font-bold text-white text-center drop-shadow-lg">{block.isGuestName ? guest.name : block.text}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </SortableBlock>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </ScrollArea>
        </div>
        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleAddBlock('image')}><ImageIcon className="mr-2 h-4 w-4" /> Thêm ảnh</Button>
            <Button variant="outline" size="sm" onClick={() => handleAddBlock('video')}><Video className="mr-2 h-4 w-4" /> Thêm video</Button>
            <Button variant="outline" size="sm" onClick={() => handleAddBlock('text')}><Type className="mr-2 h-4 w-4" /> Thêm text</Button>
          </div>
          <Button onClick={() => onSave(blocks)} disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};