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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Trash2, GripVertical, Image as ImageIcon, Video, Type } from "lucide-react";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { ContentBlock, TextItem } from "@/types/profile-content";
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
      const rawBlocks = Array.isArray(guest.profile_content) ? guest.profile_content : [];
      
      const migratedBlocks = rawBlocks.map(block => {
        if (block.type === 'text' && !('texts' in block)) {
          // This is an old text block, let's convert it.
          const oldBlock = block as any;
          return {
            id: oldBlock.id,
            type: 'text',
            texts: [{ id: uuidv4(), text: oldBlock.text || '', isGuestName: oldBlock.isGuestName || false }],
            backgroundImageUrl: oldBlock.backgroundImageUrl || '',
            imageSourceType: oldBlock.imageSourceType || 'url',
          };
        }
        return block;
      });

      setBlocks(migratedBlocks);
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
      newBlock = { ...base, type: 'image', imageUrl: '', linkUrl: '', imageSourceType: 'url' };
    } else if (type === 'video') {
      newBlock = { ...base, type: 'video', videoUrl: '' };
    } else {
      newBlock = { 
        ...base, 
        type: 'text', 
        texts: [{ id: uuidv4(), text: 'Nội dung mới', isGuestName: false }], 
        backgroundImageUrl: '', 
        imageSourceType: 'url' 
      };
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
                      <div className="w-full">
                        <div className="flex justify-between items-center mb-2">
                          <Label className="font-semibold capitalize text-slate-600">{block.type}</Label>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteBlock(block.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        <div className="flex gap-4 items-start">
                          {/* Left side: Preview */}
                          <div className="w-1/3 flex-shrink-0">
                            {block.type === 'image' && (
                              <div className="w-full aspect-video bg-slate-100 rounded-md border flex items-center justify-center">
                                {block.imageUrl ? (
                                  <img src={block.imageUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
                                ) : (
                                  <ImageIcon className="h-8 w-8 text-slate-400" />
                                )}
                              </div>
                            )}
                            {block.type === 'video' && (
                              <div className="w-full aspect-video bg-slate-100 rounded-md border flex items-center justify-center">
                                {getVideoEmbedUrl(block.videoUrl) ? (
                                  <div className="w-full h-full bg-black rounded-md">
                                    <iframe src={getVideoEmbedUrl(block.videoUrl)!} title="Video Preview" className="w-full h-full rounded-md border" allowFullScreen />
                                  </div>
                                ) : (
                                  <Video className="h-8 w-8 text-slate-400" />
                                )}
                              </div>
                            )}
                            {block.type === 'text' && (
                              <div className="w-full aspect-video rounded-md border bg-cover bg-center flex flex-col items-center justify-center p-1" style={{ backgroundImage: `url(${block.backgroundImageUrl})` }}>
                                {block.texts.map(textItem => (
                                  <p key={textItem.id} className="text-sm font-bold text-white text-center drop-shadow-lg break-words">
                                    {textItem.isGuestName ? guest.name : textItem.text}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Right side: Controls */}
                          <div className="w-2/3 flex-grow space-y-2">
                            {block.type === 'image' && (
                              <>
                                <RadioGroup
                                  value={block.imageSourceType || 'url'}
                                  onValueChange={(value) => handleUpdateBlock(block.id, 'imageSourceType', value)}
                                  className="flex gap-4"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="url" id={`image-url-${block.id}`} />
                                    <Label htmlFor={`image-url-${block.id}`}>Nhập link</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="upload" id={`image-upload-${block.id}`} />
                                    <Label htmlFor={`image-upload-${block.id}`}>Tải ảnh</Label>
                                  </div>
                                </RadioGroup>
                                {(block.imageSourceType === 'url' || !block.imageSourceType) ? (
                                  <Input placeholder="Link ảnh" value={block.imageUrl} onChange={e => handleUpdateBlock(block.id, 'imageUrl', e.target.value)} className="truncate" />
                                ) : (
                                  <ImageUploader guestId={guest.id} onUploadSuccess={url => handleUpdateBlock(block.id, 'imageUrl', url)} />
                                )}
                                <Input placeholder="Link khi click (tùy chọn)" value={block.linkUrl} onChange={e => handleUpdateBlock(block.id, 'linkUrl', e.target.value)} className="truncate" />
                              </>
                            )}
                            {block.type === 'video' && (
                              <>
                                <Input placeholder="Link Youtube hoặc Facebook" value={block.videoUrl} onChange={e => handleUpdateBlock(block.id, 'videoUrl', e.target.value)} className="truncate" />
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor={`aspectWidth-${block.id}`} className="text-xs">Rộng</Label>
                                        <Input id={`aspectWidth-${block.id}`} type="number" placeholder="16" value={block.aspectWidth || ''} onChange={e => handleUpdateBlock(block.id, 'aspectWidth', e.target.value ? Number(e.target.value) : undefined)} />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor={`aspectHeight-${block.id}`} className="text-xs">Cao</Label>
                                        <Input id={`aspectHeight-${block.id}`} type="number" placeholder="9" value={block.aspectHeight || ''} onChange={e => handleUpdateBlock(block.id, 'aspectHeight', e.target.value ? Number(e.target.value) : undefined)} />
                                    </div>
                                </div>
                              </>
                            )}
                            {block.type === 'text' && (
                              <>
                                <Label className="font-medium text-sm">Ảnh nền</Label>
                                <RadioGroup
                                  value={block.imageSourceType || 'url'}
                                  onValueChange={(value) => handleUpdateBlock(block.id, 'imageSourceType', value)}
                                  className="flex gap-4"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="url" id={`bg-url-${block.id}`} />
                                    <Label htmlFor={`bg-url-${block.id}`}>Nhập link</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="upload" id={`bg-upload-${block.id}`} />
                                    <Label htmlFor={`bg-upload-${block.id}`}>Tải ảnh</Label>
                                  </div>
                                </RadioGroup>
                                {(block.imageSourceType === 'url' || !block.imageSourceType) ? (
                                  <Input placeholder="Link ảnh nền (tùy chọn)" value={block.backgroundImageUrl} onChange={e => handleUpdateBlock(block.id, 'backgroundImageUrl', e.target.value)} className="truncate" />
                                ) : (
                                  <ImageUploader guestId={guest.id} onUploadSuccess={url => handleUpdateBlock(block.id, 'backgroundImageUrl', url)} />
                                )}
                                <Separator className="my-3" />
                                <Label className="font-medium text-sm">Nội dung Text</Label>
                                <div className="space-y-3">
                                  {block.texts.map((textItem, index) => (
                                    <div key={textItem.id} className="p-2 border rounded-md bg-white relative">
                                      <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-7 w-7" onClick={() => {
                                        const newTexts = block.texts.filter(t => t.id !== textItem.id);
                                        handleUpdateBlock(block.id, 'texts', newTexts);
                                      }}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                      <RadioGroup
                                        value={textItem.isGuestName ? 'auto' : 'manual'}
                                        onValueChange={(value) => {
                                          const newTexts = block.texts.map(t => t.id === textItem.id ? {...t, isGuestName: value === 'auto'} : t);
                                          handleUpdateBlock(block.id, 'texts', newTexts);
                                        }}
                                        className="flex gap-4 mb-2"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="manual" id={`text-manual-${textItem.id}`} />
                                          <Label htmlFor={`text-manual-${textItem.id}`}>Text nhập</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="auto" id={`text-auto-${textItem.id}`} />
                                          <Label htmlFor={`text-auto-${textItem.id}`}>Tên khách mời</Label>
                                        </div>
                                      </RadioGroup>
                                      {!textItem.isGuestName && (
                                        <Textarea placeholder={`Nội dung text ${index + 1}`} value={textItem.text} onChange={e => {
                                          const newTexts = block.texts.map(t => t.id === textItem.id ? {...t, text: e.target.value} : t);
                                          handleUpdateBlock(block.id, 'texts', newTexts);
                                        }} rows={2} />
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={() => {
                                  const newTexts = [...block.texts, { id: uuidv4(), text: 'Nội dung mới', isGuestName: false }];
                                  handleUpdateBlock(block.id, 'texts', newTexts);
                                }}>
                                  <PlusCircle className="mr-2 h-4 w-4" /> Thêm Text
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
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