import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { useMemo, useState, useEffect, useCallback } from "react";
import { ContentBlock, TextBlock } from "@/types/profile-content";
import { VideoBlockPlayer } from "@/components/public-profile/VideoBlockPlayer";
import CustomLoadingScreen from "@/components/public-profile/CustomLoadingScreen";

type CombinedGuest = (Guest | VipGuest) & { image_url?: string; profile_content?: ContentBlock[] | null };

const PublicProfile = () => {
  const { slug } = useParams();
  const [loadedVideoIds, setLoadedVideoIds] = useState(new Set<string>());
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({});

  // --- 1. Data Fetching: ONLY fetch the guest data. No templates. ---
  const { data: guest, isLoading: isLoadingGuest, isError: isErrorGuest } = useQuery<CombinedGuest | null>({
    queryKey: ['public_profile_guest_final', slug], // Use a new key to avoid stale data
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

  // --- 2. Data Processing: Directly use pre-computed data. No merging logic. ---
  const contentBlocks = useMemo(() => {
    if (!guest || !Array.isArray(guest.profile_content)) {
      return [];
    }
    return guest.profile_content;
  }, [guest]);

  useEffect(() => {
    const newDimensions: Record<string, { width: number; height: number }> = {};
    const promises = contentBlocks
      .filter((block): block is TextBlock => block.type === 'text' && !!block.useImageDimensions && !!block.backgroundImageUrl && !imageDimensions[block.id])
      .map(block => new Promise<void>(resolve => {
        const img = new Image();
        img.onload = () => {
          newDimensions[block.id] = { width: img.naturalWidth, height: img.naturalHeight };
          resolve();
        };
        img.onerror = () => resolve();
        img.src = block.backgroundImageUrl!;
      }));

    if (promises.length > 0) {
      Promise.all(promises).then(() => {
        if (Object.keys(newDimensions).length > 0) {
          setImageDimensions(prev => ({ ...prev, ...newDimensions }));
        }
      });
    }
  }, [contentBlocks]);

  const videoBlocks = useMemo(() => contentBlocks.filter(b => b.type === 'video'), [contentBlocks]);

  const handleVideoLoad = useCallback((videoId: string) => {
    setLoadedVideoIds(prev => {
      if (prev.has(videoId)) return prev;
      const newSet = new Set(prev);
      newSet.add(videoId);
      return newSet;
    });
  }, []);

  useEffect(() => {
    setLoadedVideoIds(new Set());
  }, [guest]);

  // --- 3. Conditional Returns ---
  if (isLoadingGuest) {
    return <CustomLoadingScreen />;
  }

  if (isErrorGuest || !guest) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-[#fff5ea] to-[#e5b899] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white/70 rounded-xl shadow-lg max-w-sm w-full">
          <h1 className="text-2xl font-bold text-red-600">Không tìm thấy Profile</h1>
          <p className="text-slate-600 mt-2">Liên kết có thể đã sai hoặc profile đã bị xóa.</p>
        </div>
      </div>
    );
  }

  // --- 4. Main Render Logic ---
  const areAllVideosLoaded = loadedVideoIds.size >= videoBlocks.length;
  const showContentLoader = videoBlocks.length > 0 && !areAllVideosLoaded;

  return (
    <>
      {showContentLoader && (
        <div className="fixed inset-0 w-full h-screen z-50">
          <CustomLoadingScreen />
        </div>
      )}
      <div style={{ visibility: showContentLoader ? 'hidden' : 'visible' }}>
        <div className="w-full min-h-screen bg-black flex justify-center">
          <div className="w-full max-w-md bg-white min-h-screen shadow-lg relative">
            <div className="flex flex-col">
              {contentBlocks.map((block) => {
                if (!block) return null;
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
                    return <VideoBlockPlayer key={block.id} block={block} onVideoLoad={handleVideoLoad} />;
                  case 'text':
                    const dimensions = imageDimensions[block.id];
                    const textBlockStyle: React.CSSProperties = {
                      backgroundImage: block.backgroundImageUrl ? `url(${block.backgroundImageUrl})` : undefined,
                      width: '100%',
                      maxWidth: '100%',
                    };
                    if (block.useImageDimensions && dimensions) {
                      textBlockStyle.aspectRatio = `${dimensions.width} / ${dimensions.height}`;
                    } else {
                      textBlockStyle.minHeight = '16rem';
                    }

                    return (
                      <div key={block.id} className="w-full flex justify-center">
                        <div
                          className="flex flex-col items-center justify-start p-4 bg-cover bg-center"
                          style={textBlockStyle}
                        >
                          {Array.isArray(block.items) && block.items.map(item => {
                            if (!item) return null;
                            return (
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
                                      color: item.color || '#000000',
                                      fontWeight: item.fontWeight || 'bold',
                                      fontStyle: item.fontStyle || 'normal',
                                      fontFamily: item.fontFamily || 'sans-serif',
                                      lineHeight: 1.2,
                                      textTransform: item.isCaps ? 'uppercase' : 'none',
                                    }}
                                  >
                                    {item.isGuestName ? guest.name : (item.isGuestRole ? guest.role : item.text)}
                                  </p>
                                ) : (
                                  item.imageUrl && <img 
                                    src={item.imageUrl} 
                                    alt="Profile item" 
                                    style={{ 
                                      width: `${item.width}%`, 
                                      margin: '0 auto' 
                                    }} 
                                  />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PublicProfile;