import { useParams } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { useMemo } from "react";

// Define explicit types for content blocks
type ImageBlock = { type: 'image'; imageUrl: string; linkUrl?: string };
type VideoBlock = { type: 'video'; videoUrl: string };
type TextBlock = { type: 'text'; text: string; backgroundImageUrl: string; isGuestName?: boolean };
type ContentBlock = ImageBlock | VideoBlock | TextBlock;

// Mock data for a content block
const mockContentBlocks: ContentBlock[] = [
  { type: 'image', imageUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=2787&auto=format&fit=crop', linkUrl: 'https://example.com' },
  { type: 'video', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
  { type: 'text', text: 'Welcome to my public profile!', backgroundImageUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2929&auto=format&fit=crop' },
  { type: 'image', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2787&auto=format&fit=crop' },
];

type CombinedGuest = (Guest | VipGuest) & { image_url?: string };

const PublicProfile = () => {
  const { slug } = useParams();

  const { data: guest, isLoading } = useQuery<CombinedGuest | null>({
    queryKey: ['public_profile', slug],
    queryFn: async () => {
        if (!slug) return null;

        const { data: vipGuest } = await supabase.from('vip_guests').select('*').eq('slug', slug).single();
        if (vipGuest) return vipGuest as VipGuest;

        const { data: regularGuest } = await supabase.from('guests').select('*').eq('slug', slug).single();
        if (regularGuest) return regularGuest as Guest;

        return null;
    },
    enabled: !!slug,
  });

  const getGuestNameFallback = (name: string = "") => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const contentBlocks: ContentBlock[] = useMemo(() => {
    if (!guest) return mockContentBlocks;
    // Insert guest name as the first text block
    const guestNameBlock: TextBlock = { type: 'text', text: guest.name, backgroundImageUrl: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2929&auto=format&fit=crop', isGuestName: true };
    return [
      ...mockContentBlocks.slice(0, 2),
      guestNameBlock,
      ...mockContentBlocks.slice(2)
    ];
  }, [guest]);

  return (
    <div className="w-full min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-lg">
        <div className="p-4 bg-slate-50 border-b">
          {isLoading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ) : guest ? (
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                <AvatarImage src={guest.image_url} />
                <AvatarFallback>{getGuestNameFallback(guest.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{guest.name}</h1>
                <p className="text-sm text-slate-500">{guest.role}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <h1 className="text-xl font-bold text-red-500">Không tìm thấy Profile</h1>
            </div>
          )}
        </div>
        
        {guest && (
          <div className="flex flex-col">
            {contentBlocks.map((block, index) => {
                switch (block.type) {
                  case 'image':
                    const imageElement = <img src={block.imageUrl} alt={`Content ${index + 1}`} className="w-full h-auto object-cover" />;
                    return (
                      <div key={index} className="w-full">
                        {block.linkUrl ? (
                          <a href={block.linkUrl} target="_blank" rel="noopener noreferrer">
                            {imageElement}
                          </a>
                        ) : (
                          imageElement
                        )}
                      </div>
                    );
                  case 'video':
                    return (
                      <div key={index} className="w-full">
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
                      </div>
                    );
                  case 'text':
                    return (
                      <div key={index} className="w-full">
                        <div
                          className="w-full h-64 flex items-center justify-center p-4 bg-cover bg-center"
                          style={{ backgroundImage: `url(${block.backgroundImageUrl})` }}
                        >
                          <h2 className={`text-4xl font-bold text-white text-center drop-shadow-lg ${block.isGuestName ? 'italic' : ''}`}>
                            {block.text}
                          </h2>
                        </div>
                      </div>
                    );
                  default:
                    return null;
                }
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;