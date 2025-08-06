import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { useMemo } from "react";
import { ContentBlock, TextBlock } from "@/types/profile-content";
import { getVideoEmbedUrl } from "@/lib/video";
import { Skeleton } from "@/components/ui/skeleton";

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

  const contentBlocks: ContentBlock[] = useMemo(() => {
    if (!guest || !guest.profile_content || !Array.isArray(guest.profile_content)) {
      return [];
    }
    return guest.profile_content;
  }, [guest]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }

    if (!guest) {
      return (
        <div className="text-center py-8">
          <h1 className="text-xl font-bold text-red-500">Không tìm thấy Profile</h1>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        {contentBlocks.length > 0 ? (
          contentBlocks.map((block) => {
            switch (block.type) {
              case 'image':
                const imageElement = <img src={block.imageUrl} alt="Profile content" className="h-auto object-cover" style={{ width: `${block.width || 100}%` }} />;
                return (
                  <div key={block.id} className="w-full flex justify-center">
                    {block.linkUrl ? (
                      <a href={block.linkUrl} target="_blank" rel="noopener noreferrer" style={{ width: `${block.width || 100}%` }}>
                        {imageElement}
                      </a>
                    ) : (
                      imageElement
                    )}
                  </div>
                );
              case 'video':
                const embedUrl = getVideoEmbedUrl(block.videoUrl);
                if (!embedUrl) return null;
                const aspectRatio = block.aspectWidth && block.aspectHeight ? `${block.aspectWidth} / ${block.aspectHeight}` : '16 / 9';
                return (
                  <div key={block.id} className="w-full bg-black" style={{ aspectRatio }}>
                    <iframe
                      src={embedUrl}
                      title="Video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                );
              case 'text':
                return (
                  <div key={block.id} className="w-full">
                    <div
                      className="w-full min-h-[16rem] flex flex-col items-center justify-center p-4 bg-cover bg-center"
                      style={{ backgroundImage: `url(${block.backgroundImageUrl})` }}
                    >
                      {(block as TextBlock).items.map(item => (
                        <div 
                          key={item.id} 
                          style={{ 
                            marginTop: `${item.marginTop || 0}px`,
                            marginRight: `${item.marginRight || 0}px`,
                            marginBottom: `${item.marginBottom || 0}px`,
                            marginLeft: `${item.marginLeft || 0}px`,
                          }}
                        >
                          {item.type === 'text' ? (
                            <p
                              className="text-center"
                              style={{
                                fontSize: `${item.fontSize || 32}px`,
                                color: item.color || '#FFFFFF',
                                fontWeight: item.fontWeight || 'bold',
                                fontStyle: item.fontStyle || 'normal',
                                fontFamily: item.fontFamily || 'sans-serif',
                                lineHeight: 1.2,
                              }}
                            >
                              {item.isGuestName ? guest.name : item.text}
                            </p>
                          ) : (
                            <img 
                              src={item.imageUrl} 
                              alt="Profile item" 
                              style={{ 
                                width: `${item.width || 100}%`, 
                                margin: '0 auto' 
                              }} 
                            />
                          )}
                        </div>
                      ))}
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
    );
  };

  return (
    <div className="w-full min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-lg">
        {renderContent()}
      </div>
    </div>
  );
};

export default PublicProfile;