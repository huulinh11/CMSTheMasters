import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DresscodeDisplayProps {
  title?: string | null;
  imageUrl?: string | null;
}

export const DresscodeDisplay = ({ title, imageUrl }: DresscodeDisplayProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-slate-800 text-center">{title || 'Trang phục'}</h2>
      {imageUrl ? (
        <Dialog>
          <DialogTrigger asChild>
            <img 
              src={imageUrl} 
              alt={title || 'Dresscode'} 
              className="w-full h-auto rounded-lg cursor-pointer shadow-md" 
            />
          </DialogTrigger>
          <DialogContent className="p-0 max-w-[90vw] h-[90vh] bg-transparent border-none shadow-none flex items-center justify-center">
            <img 
              src={imageUrl} 
              alt={title || 'Dresscode'} 
              className="max-w-full max-h-full object-contain" 
            />
          </DialogContent>
        </Dialog>
      ) : (
        <div className="text-center text-slate-500 p-8">
          <p>Nội dung dresscode sẽ được cập nhật sớm.</p>
        </div>
      )}
    </div>
  );
};