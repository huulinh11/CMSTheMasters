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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Trash2, GripVertical, Image as ImageIcon, Video, Type, AlertTriangle } from "lucide-react";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { ContentBlock, TextBlock, TextBlockItem } from "@/types/profile-content";
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
import { Slider } from "@/components/ui/slider";

type CombinedGuest = (VipGuest | Guest) & { type: 'Chức vụ' | 'Khách mời' };

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: CombinedGuest | null;
  onSave?: (content: ContentBlock[]) => void;
  onContentChange?: (content: ContentBlock[]) => void;
  isSaving: boolean;
  isTemplateMode?: boolean;
  isSubDialog?: boolean;
}

const SortableItem = ({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div className="flex items-start gap-2 w-full">
        <div {...attributes} {...listeners} className="cursor-grab touch-none p-2">
          <GripVertical className="h-5 w-5 text-slate-400" />
        </div>
        <div className="flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
};

const fontFamilies = [
  { value: 'sans-serif', label: 'Mặc định (Sans-serif)' },
  { value: 'serif', label: 'Serif' },
  { value: 'monospace', label: 'Monospace' },
  { value: 'cursive', label: 'Cursive' },
  { value: 'fantasy', label: 'Fantasy' },
];


export const EditProfileDialog = ({ open, onOpenChange, guest, onSave, onContentChange, isSaving, isTemplateMode = false, isSubDialog = false }: EditProfileDialogProps) => {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  useEffect(() => {
    if (guest) {
      const rawBlocks = Array.isArray(guest.profile_content) ? guest.profile_content : [];
      
      const migratedBlocks = rawBlocks.map(block => {
        if (block.type === 'image') {
          return { ...block, width: (block as any).width ?? 100 };
        }
        if (block.type === 'text') {
          const textBlock = block as any;
          let items: TextBlockItem[] = [];
          if (textBlock.items) {
            items = textBlock.items;
          } else if (textBlock.texts) {
            items = textBlock.texts.map((t: any) => ({ ...t, type: 'text' }));
          }
          
          const migratedItems = items.map((item: any) => {
            const baseItem = {
              ...item,
              marginTop: item.marginTop ?? 0,
              marginRight: item.marginRight ?? 0,
              marginBottom: item.marginBottom ?? 0,
              marginLeft: item.marginLeft ?? 0,
            };
            if (item.type === 'text') {
              return {
                ...baseItem,
                fontStyle: item.fontStyle || 'normal',
                fontFamily: item.fontFamily || 'sans-serif',
                fontWeight: item.fontWeight || 'bold',
                fontSize: item.fontSize || 32,
                color: item.color || '#FFFFFF',
              };
            }
            return baseItem;
          });

          return { ...textBlock, items: migratedItems, texts: undefined };
        }
        return block;
      });

      setBlocks(migratedBlocks as ContentBlock[]);
    }
  }, [guest]);

  useEffect(() => {
    if (onContentChange) {
      onContentChange(blocks);
    }
  }, [blocks, onContentChange]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAddBlock = (type: 'image' | 'video' | 'text') => {
    let newBlock: ContentBlock;
    const base = { id: uuidv4() };
    if (type === 'image') {
      newBlock = { ...base, type: 'image', imageUrl: '', linkUrl: '', imageSourceType: 'url', width: 100 };
    } else if (type === 'video') {
      newBlock = { ...base, type: 'video', videoUrl: '' };
    } else {
      newBlock = { 
        ...base, 
        type: 'text', 
        items: [], 
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
    if (isTemplateMode) return;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeId = active.id.toString();
      const overId = over.id.toString();

      if (activeId.startsWith('block_') && overId.startsWith('block_')) {
        const oldIndex = blocks.findIndex((b) => `block_${b.id}` === activeId);
        const newIndex = blocks.findIndex((b) => `block_${b.id}` === overId);
        setBlocks(arrayMove(blocks, oldIndex, newIndex));
      } else if (activeId.startsWith('item_') && overId.startsWith('item_')) {
        const [, blockId] = activeId.split('_');
        const blockIndex = blocks.findIndex(b => b.id === blockId);
        if (blockIndex > -1 && blocks[blockIndex].type === 'text') {
          const textBlock = blocks[blockIndex] as TextBlock;
          const oldItemIndex = textBlock.items.findIndex(t => `item_${blockId}_${t.id}` === activeId);
          const newItemIndex = textBlock.items.findIndex(t => `item_${blockId}_${t.id}` === overId);
          
          const newItems = arrayMove(textBlock.items, oldItemIndex, newItemIndex);
          const newBlocks = [...blocks];
          newBlocks[blockIndex] = { ...textBlock, items: newItems };
          setBlocks(newBlocks);
        }
      }
    }
  }

  if (!guest) return null;

  const mainContent = (
    <>
      {isTemplateMode && (
        <div className="p-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center text-yellow-800">
          <AlertTriangle className="h-5 w-5 mr-3" />
          <p className="text-sm">Bạn đang chỉnh sửa dựa trên một template. Chỉ nội dung (text, link) có thể thay đổi.</p>
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex-grow overflow-hidden flex flex-col">
          <ScrollArea className="flex-grow pr-4">
            <SortableContext items={blocks.map(b => `block_${b.id}`)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {blocks.map(block => (
                  <SortableItem key={block.id} id={`block_${block.id}`} className="p-4 border rounded-lg bg-slate-50">
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-2">
                        <Label className="font-semibold capitalize text-slate-600">{block.type}</Label>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteBlock(block.id)} disabled={isTemplateMode}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="flex gap-4 items-start">
                        {/* Preview */}
                        <div className="w-1/3 flex-shrink-0 sticky top-0">
                          {block.type === 'image' && (
                            <div className="w-full aspect-video bg-slate-100 rounded-md border flex items-center justify-center overflow-hidden">
                              {block.imageUrl ? <img src={block.imageUrl} alt="Preview" className="h-full object-contain" style={{ width: `${block.width || 100}%` }} /> : <ImageIcon className="h-8 w-8 text-slate-400" />}
                            </div>
                          )}
                          {block.type === 'video' && (
                            <div className="w-full aspect-video bg-slate-100 rounded-md border flex items-center justify-center">
                              {getVideoEmbedUrl(block.videoUrl) ? <div className="w-full h-full bg-black rounded-md"><iframe src={getVideoEmbedUrl(block.videoUrl)!} title="Video Preview" className="w-full h-full rounded-md border" allowFullScreen /></div> : <Video className="h-8 w-8 text-slate-400" />}
                            </div>
                          )}
                          {block.type === 'text' && (
                            <div className="w-full aspect-video rounded-md border bg-cover bg-center flex flex-col items-center justify-center p-1" style={{ backgroundImage: `url(${block.backgroundImageUrl})` }}>
                              {block.items.map(item => (
                                <div key={item.id} style={{ marginTop: `${item.marginTop}px`, marginRight: `${item.marginRight}px`, marginBottom: `${item.marginBottom}px`, marginLeft: `${item.marginLeft}px` }}>
                                  {item.type === 'text' ? (
                                    <p className="text-sm text-center break-words" style={{ color: item.color, fontSize: `${item.fontSize}px`, fontWeight: item.fontWeight, fontStyle: item.fontStyle, fontFamily: item.fontFamily }}>
                                      {item.isGuestName ? guest.name : item.text}
                                    </p>
                                  ) : (
                                    <img src={item.imageUrl} alt="item" style={{ width: `${item.width}%`, margin: '0 auto' }} />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Controls */}
                        <div className="w-2/3 flex-grow space-y-2">
                          {block.type === 'image' && (
                            <>
                              <RadioGroup value={block.imageSourceType || 'url'} onValueChange={(value) => handleUpdateBlock(block.id, 'imageSourceType', value)} className="flex gap-4" disabled={isTemplateMode}><div className="flex items-center space-x-2"><RadioGroupItem value="url" id={`image-url-${block.id}`} /><Label htmlFor={`image-url-${block.id}`}>Nhập link</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="upload" id={`image-upload-${block.id}`} /><Label htmlFor={`image-upload-${block.id}`}>Tải ảnh</Label></div></RadioGroup>
                              {(block.imageSourceType === 'url' || !block.imageSourceType) ? <Input placeholder="Link ảnh" value={block.imageUrl} onChange={e => handleUpdateBlock(block.id, 'imageUrl', e.target.value)} className="truncate" /> : <ImageUploader guestId={guest.id} onUploadSuccess={url => handleUpdateBlock(block.id, 'imageUrl', url)} />}
                              <Input placeholder="Link khi click (tùy chọn)" value={block.linkUrl} onChange={e => handleUpdateBlock(block.id, 'linkUrl', e.target.value)} className="truncate" />
                              <div><Label className="text-xs">Rộng (%)</Label><Slider value={[block.width || 100]} onValueChange={([val]) => handleUpdateBlock(block.id, 'width', val)} max={100} step={1} disabled={isTemplateMode} /></div>
                            </>
                          )}
                          {block.type === 'video' && (
                            <>
                              <Input placeholder="Link Youtube hoặc Facebook" value={block.videoUrl} onChange={e => handleUpdateBlock(block.id, 'videoUrl', e.target.value)} className="truncate" />
                              <div className="flex items-center gap-2">
                                <div className="flex-1 space-y-1"><Label htmlFor={`aspectWidth-${block.id}`} className="text-xs">Rộng</Label><Input id={`aspectWidth-${block.id}`} type="number" placeholder="16" value={block.aspectWidth || ''} onChange={e => handleUpdateBlock(block.id, 'aspectWidth', e.target.value ? Number(e.target.value) : undefined)} disabled={isTemplateMode} /></div>
                                <div className="flex-1 space-y-1"><Label htmlFor={`aspectHeight-${block.id}`} className="text-xs">Cao</Label><Input id={`aspectHeight-${block.id}`} type="number" placeholder="9" value={block.aspectHeight || ''} onChange={e => handleUpdateBlock(block.id, 'aspectHeight', e.target.value ? Number(e.target.value) : undefined)} disabled={isTemplateMode} /></div>
                              </div>
                            </>
                          )}
                          {block.type === 'text' && (
                            <>
                              <Label className="font-medium text-sm">Ảnh nền</Label>
                              <RadioGroup value={block.imageSourceType || 'url'} onValueChange={(value) => handleUpdateBlock(block.id, 'imageSourceType', value)} className="flex gap-4" disabled={isTemplateMode}><div className="flex items-center space-x-2"><RadioGroupItem value="url" id={`bg-url-${block.id}`} /><Label htmlFor={`bg-url-${block.id}`}>Nhập link</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="upload" id={`bg-upload-${block.id}`} /><Label htmlFor={`bg-upload-${block.id}`}>Tải ảnh</Label></div></RadioGroup>
                              {(block.imageSourceType === 'url' || !block.imageSourceType) ? <Input placeholder="Link ảnh nền (tùy chọn)" value={block.backgroundImageUrl} onChange={e => handleUpdateBlock(block.id, 'backgroundImageUrl', e.target.value)} className="truncate" disabled={isTemplateMode} /> : <ImageUploader guestId={guest.id} onUploadSuccess={url => handleUpdateBlock(block.id, 'backgroundImageUrl', url)} />}
                              <Separator className="my-3" />
                              <Label className="font-medium text-sm">Nội dung</Label>
                              <SortableContext items={block.items.map(t => `item_${block.id}_${t.id}`)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-3">
                                  {block.items.map((item) => (
                                    <SortableItem key={item.id} id={`item_${block.id}_${item.id}`} className="p-2 border rounded-md bg-white relative">
                                      <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-7 w-7" onClick={() => handleUpdateBlock(block.id, 'items', block.items.filter(i => i.id !== item.id))} disabled={isTemplateMode}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                      {item.type === 'text' ? (
                                        <div className="space-y-2">
                                          <RadioGroup value={item.isGuestName ? 'auto' : 'manual'} onValueChange={(value) => handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, isGuestName: value === 'auto'} : i))} className="flex gap-4" disabled={isTemplateMode}><div className="flex items-center space-x-2"><RadioGroupItem value="manual" id={`text-manual-${item.id}`} /><Label htmlFor={`text-manual-${item.id}`}>Text nhập</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="auto" id={`text-auto-${item.id}`} /><Label htmlFor={`text-auto-${item.id}`}>Tên khách mời</Label></div></RadioGroup>
                                          {!item.isGuestName && <Textarea placeholder="Nội dung text" value={item.text} onChange={e => handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, text: e.target.value} : i))} rows={2} />}
                                          <div className="grid grid-cols-2 gap-2">
                                            <div><Label className="text-xs">Font</Label><Select value={item.fontFamily || 'sans-serif'} onValueChange={value => handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, fontFamily: value} : i))} disabled={isTemplateMode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{fontFamilies.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select></div>
                                            <div><Label className="text-xs">Kiểu</Label><Select value={`${item.fontWeight || 'bold'}-${item.fontStyle || 'normal'}`} onValueChange={value => { const [fontWeight, fontStyle] = value.split('-'); handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, fontWeight, fontStyle} : i))}} disabled={isTemplateMode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="normal-normal">Thường</SelectItem><SelectItem value="bold-normal">Đậm</SelectItem><SelectItem value="normal-italic">Nghiêng</SelectItem><SelectItem value="bold-italic">Đậm Nghiêng</SelectItem></SelectContent></Select></div>
                                          </div>
                                          <div className="grid grid-cols-2 gap-2">
                                            <div><Label className="text-xs">Cỡ chữ</Label><Input type="number" value={item.fontSize || 32} onChange={e => handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, fontSize: Number(e.target.value)} : i))} disabled={isTemplateMode} /></div>
                                            <div><Label className="text-xs">Màu chữ</Label><Input type="color" value={item.color || '#FFFFFF'} onChange={e => handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, color: e.target.value} : i))} className="p-1 h-10" disabled={isTemplateMode} /></div>
                                          </div>
                                          <div className="grid grid-cols-4 gap-1">
                                            <div><Label className="text-xs">M.Top</Label><Input type="number" value={item.marginTop || 0} onChange={e => handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, marginTop: Number(e.target.value)} : i))} disabled={isTemplateMode} /></div>
                                            <div><Label className="text-xs">M.Right</Label><Input type="number" value={item.marginRight || 0} onChange={e => handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, marginRight: Number(e.target.value)} : i))} disabled={isTemplateMode} /></div>
                                            <div><Label className="text-xs">M.Bottom</Label><Input type="number" value={item.marginBottom || 0} onChange={e => handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, marginBottom: Number(e.target.value)} : i))} disabled={isTemplateMode} /></div>
                                            <div><Label className="text-xs">M.Left</Label><Input type="number" value={item.marginLeft || 0} onChange={e => handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, marginLeft: Number(e.target.value)} : i))} disabled={isTemplateMode} /></div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          <RadioGroup value={item.imageSourceType || 'url'} onValueChange={(value) => handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, imageSourceType: value} : i))} className="flex gap-4" disabled={isTemplateMode}><div className="flex items-center space-x-2"><RadioGroupItem value="url" id={`item-img-url-${item.id}`} /><Label htmlFor={`item-img-url-${item.id}`}>Nhập link</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="upload" id={`item-img-upload-${item.id}`} /><Label htmlFor={`item-img-upload-${item.id}`}>Tải ảnh</Label></div></RadioGroup>
                                          {(item.imageSourceType === 'url' || !item.imageSourceType) ? <Input placeholder="Link ảnh" value={item.imageUrl} onChange={e => handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, imageUrl: e.target.value} : i))} /> : <ImageUploader guestId={guest.id} onUploadSuccess={url => handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, imageUrl: url} : i))} />}
                                          <div><Label className="text-xs">Rộng (%)</Label><Slider value={[item.width || 100]} onValueChange={([val]) => handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, width: val} : i))} max={100} step={1} disabled={isTemplateMode} /></div>
                                          <div className="grid grid-cols-4 gap-1">
                                            <div><Label className="text-xs">M.Top</Label><Input type="number" value={item.marginTop || 0} onChange={e => handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, marginTop: Number(e.target.value)} : i))} disabled={isTemplateMode} /></div>
                                            <div><Label className="text-xs">M.Right</Label><Input type="number" value={item.marginRight || 0} onChange={e => handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, marginRight: Number(e.target.value)} : i))} disabled={isTemplateMode} /></div>
                                            <div><Label className="text-xs">M.Bottom</Label><Input type="number" value={item.marginBottom || 0} onChange={e => handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, marginBottom: Number(e.target.value)} : i))} disabled={isTemplateMode} /></div>
                                            <div><Label className="text-xs">M.Left</Label><Input type="number" value={item.marginLeft || 0} onChange={e => handleUpdateBlock(block.id, 'items', block.items.map(i => i.id === item.id ? {...i, marginLeft: Number(e.target.value)} : i))} disabled={isTemplateMode} /></div>
                                          </div>
                                        </div>
                                      )}
                                    </SortableItem>
                                  ))}
                                </div>
                              </SortableContext>
                              <div className="flex gap-2 mt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => handleUpdateBlock(block.id, 'items', [...block.items, { id: uuidv4(), type: 'text', text: 'Nội dung mới', isGuestName: false, fontSize: 32, color: '#FFFFFF', fontWeight: 'bold', fontStyle: 'normal', fontFamily: 'sans-serif', marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0 }])} disabled={isTemplateMode}><PlusCircle className="mr-2 h-4 w-4" /> Thêm Text</Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => handleUpdateBlock(block.id, 'items', [...block.items, { id: uuidv4(), type: 'image', imageUrl: '', imageSourceType: 'url', width: 100, marginTop: 10, marginRight: 0, marginBottom: 0, marginLeft: 0 }])} disabled={isTemplateMode}><ImageIcon className="mr-2 h-4 w-4" /> Thêm Ảnh</Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </ScrollArea>
        </div>
      </DndContext>
    </>
  );

  if (isSubDialog) {
    return mainContent;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Profile: {guest.name}</DialogTitle>
          <DialogDescription>Thêm, xóa, và sắp xếp các khối nội dung cho trang public.</DialogDescription>
        </DialogHeader>
        {mainContent}
        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleAddBlock('image')} disabled={isTemplateMode}><ImageIcon className="mr-2 h-4 w-4" /> Thêm ảnh</Button>
            <Button variant="outline" size="sm" onClick={() => handleAddBlock('video')} disabled={isTemplateMode}><Video className="mr-2 h-4 w-4" /> Thêm video</Button>
            <Button variant="outline" size="sm" onClick={() => handleAddBlock('text')} disabled={isTemplateMode}><Type className="mr-2 h-4 w-4" /> Thêm text</Button>
          </div>
          <Button onClick={() => onSave && onSave(blocks)} disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};