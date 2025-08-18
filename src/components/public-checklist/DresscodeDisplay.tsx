interface DresscodeDisplayProps {
  title?: string | null;
  images?: { imageUrl: string }[] | null;
}

export const DresscodeDisplay = ({ title, images }: DresscodeDisplayProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-slate-800 text-center">{title || 'Trang phục'}</h2>
      {images && images.length > 0 ? (
        <div className="space-y-4">
          {images.map((image, index) => (
            <div key={index} className="overflow-hidden rounded-lg shadow-md">
              <img 
                src={image.imageUrl} 
                alt={`${title || 'Dresscode'} ${index + 1}`} 
                className="w-full h-auto object-contain" 
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-500 p-8">
          <p>Nội dung dresscode sẽ được cập nhật sớm.</p>
        </div>
      )}
    </div>
  );
};