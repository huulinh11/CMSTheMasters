import { useParams } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { useMemo } from "react";
import { ContentBlock } from "@/types/profile-content";

type CombinedGuest = (Guest | VipGuest) & { image_url?: string; profile_content?: any };

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
    if (!guest || !guest.profile_content || !Array.isArray(guest.profile_content)) {
      return [];
    }
    return guest.profile_content;
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
            {contentBlocks.length > 0 ? (
              contentBlocks.map((block) => {
                const textContent = block.type === 'text' && block.isGuestName ? guest.name : (block.type === 'text' ? block.text : '');
                switch (block.type) {
                  case 'image':
                    const imageElement = <img src={block.imageUrl} alt="Profile content" className="w-full h-auto object-cover" />;
                    return (
                      <div key={block.id} className="w-full">
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
                      <div key={block.id} className="w-full">
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
                      <div key={block.id} className="w-full">
                        <div
                          className="w-full h-64 flex items-center justify-center p-4 bg-cover bg-center"
                          style={{ backgroundImage: `url(${block.backgroundImageUrl})` }}
                        >
                          <h2 className={`text-4xl font-bold text-white text-center drop-shadow-lg ${block.isGuestName ? 'italic' : ''}`}>
                            {textContent}
                          </h2>
                        </div>
                      </div>
                    );
                  default:
                    return null;
                }
              })
            ) : (
              <div className="p-8 text-center text-slate-500">
                <p>Chưa có nội dung cho profile này.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;