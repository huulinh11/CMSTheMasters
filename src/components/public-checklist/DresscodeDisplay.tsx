import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DresscodeDisplayProps {
  title?: string | null;
  images?: { imageUrl: string }[] | null;
}

export const DresscodeDisplay = ({ title, images }: DresscodeDisplayProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const openDialog = (index: number) => {
    setSelectedIndex(index);
    setIsDialogOpen(true);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!images) return;
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!images) return;
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-slate-800 text-center">{title || 'Trang phục'}</h2>
      {images && images.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {images.map((image, index) => (
              <button 
                key={index} 
                onClick={() => openDialog(index)} 
                className="aspect-square overflow-hidden rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <img 
                  src={image.imageUrl} 
                  alt={`${title || 'Dresscode'} ${index + 1}`} 
                  className="w-full h-full object-cover" 
                />
              </button>
            ))}
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="p-0 max-w-[90vw] h-[90vh] bg-transparent border-none shadow-none flex items-center justify-center">
              {images.length > 1 && (
                <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 text-white z-10" onClick={prevImage}>
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}
              <img 
                src={images[selectedIndex]?.imageUrl} 
                alt={`${title || 'Dresscode'} ${selectedIndex + 1}`} 
                className="max-w-full max-h-full object-contain" 
              />
              {images.length > 1 && (
                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 text-white z-10" onClick={nextImage}>
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="text-center text-slate-500 p-8">
          <p>Nội dung dresscode sẽ được cập nhật sớm.</p>
        </div>
      )}
    </div>
  );
};