import { useParams } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Mock data for a content block
const mockContentBlocks = [
  { type: 'image', imageUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=2787&auto=format&fit=crop', linkUrl: 'https://example.com' },
  { type: 'video', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
  { type: 'text', text: 'Thu Anh', backgroundImageUrl: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2929&auto=format&fit=crop', isGuestName: true },
  { type: 'text', text: 'Welcome to my public profile!', backgroundImageUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2929&auto=format&fit=crop' },
  { type: 'image', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2787&auto=format&fit=crop' },
];

const PublicProfile = () => {
  const { slug } = useParams();

  // In a real implementation, we would fetch guest data and content blocks based on the slug.
  // For now, we'll use the slug to show who we're viewing.

  return (
    <div className="w-full min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-lg">
        <div className="p-4 bg-slate-50 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white shadow-md">
              <AvatarImage src="https://i.pravatar.cc/150?u=thu-anh" />
              <AvatarFallback>TA</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Thu Anh</h1>
              <p className="text-sm text-slate-500">Viewing profile for: {slug}</p>
            </div>
          </div>
        </div>
        
        {/* Content blocks will be rendered here */}
        <div className="flex flex-col">
          {mockContentBlocks.map((block, index) => (
            <div key={index} className="w-full">
              {block.type === 'image' && block.imageUrl && (
                <a href={block.linkUrl} target="_blank" rel="noopener noreferrer">
                  <img src={block.imageUrl} alt={`Content ${index + 1}`} className="w-full h-auto object-cover" />
                </a>
              )}
              {block.type === 'video' && block.videoUrl && (
                <div className="aspect-w-16 aspect-h-9">
                  <iframe
                    src={block.videoUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              )}
              {block.type === 'text' && block.text && (
                <div
                  className="w-full h-64 flex items-center justify-center p-4 bg-cover bg-center"
                  style={{ backgroundImage: `url(${block.backgroundImageUrl})` }}
                >
                  <h2 className={`text-4xl font-bold text-white text-center drop-shadow-lg ${block.isGuestName ? 'italic' : ''}`}>
                    {block.text}
                  </h2>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;