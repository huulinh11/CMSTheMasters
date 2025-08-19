import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { useMemo, useState, useEffect, useCallback } from "react";
import { ContentBlock, TextBlock } from "@/types/profile-content";
import { ProfileTemplate } from "@/types/profile-template";
import { VideoBlockPlayer } from "@/components/public-profile/VideoBlockPlayer";
import CustomLoadingScreen from "@/components/public-profile/CustomLoadingScreen";

type CombinedGuest = (Guest | VipGuest) & { image_url?: string; profile_content?: ContentBlock[] | null };

const PublicProfile = () => {
  const { slug } = useParams();
  const [loadedVideoIds, setLoadedVideoIds] = useState(new Set<string>());
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({});

  const { data: guest, isLoading: isLoadingGuest } = useQuery<CombinedGuest | null>({
    queryKey: ['public_profile_guest', slug],
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

  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<ProfileTemplate[]>({
    queryKey: ['profile_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profile_templates').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['checklist_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checklist_settings').select('loader_config, loading_text_config').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const contentBlocks = useMemo(() => {
    if (!guest) {
      return [];
    }

    // 1. Determine active template
    let template: ProfileTemplate | null = null;
    if (guest.template_id) {
      template = templates.find(t => t.id === guest.template_id) || null;
    } 
    if (!template) { // Fallback to role-based template if no specific one is assigned
      template = templates.find(t => t.assigned_roles?.includes(guest.role)) || null;
    }

    // 2. If there is a template, merge content
    if (template) {
      const templateContent = template.content || [];
      const userContent = guest.profile_content || [];
      const userContentMap = new Map(userContent.map((b) => [b.id, b]));

      const mergedContent = templateContent.map((templateBlock): ContentBlock => {
        const userBlock = userContentMap.get(templateBlock.id);

        // If user has no override for this block, or types mismatch, use template block as is.
        if (!userBlock || userBlock.type !== templateBlock.type) {
          return templateBlock;
        }

        // Merge data from userBlock into templateBlock structure
        switch (templateBlock.type) {
          case 'image':
            if (userBlock.type === 'image') {
              return { ...templateBlock, imageUrl: userBlock.imageUrl, linkUrl: userBlock.linkUrl };
            }
            break;
          case 'video':
            if (userBlock.type === 'video') {
              return { ...templateBlock, videoUrl: userBlock.videoUrl };
            }
            break;
          case 'text':
            if (userBlock.type === 'text') {
              const userItemsMap = new Map((userBlock.items || []).map(item => [item.id, item]));
              const mergedItems = templateBlock.items.map(templateItem => {
                const userItem = userItemsMap.get(templateItem.id);
                if (!userItem || userItem.type !== templateItem.type) {
                  return templateItem;
                }
                if (templateItem.type === 'text' && userItem.type === 'text') {
                  return { ...templateItem, text: userItem.text };
                }
                if (templateItem.type === 'image' && userItem.type === 'image') {
                  return { ...templateItem, imageUrl: userItem.imageUrl };
                }
                return templateItem;
              });
              return { ...templateBlock, items: mergedItems };
            }
            break;
        }
        return templateBlock;
      });

      return mergedContent;
    }

    // 3. No template, use guest content directly
    return guest.profile_content || [];
  }, [guest, templates]);

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
      if (prev.has(videoId)) {
        return prev;
      }
      const newSet = new Set(prev);
      newSet.add(videoId);
      return newSet;
    });
  }, []);

  useEffect(() => {
    setLoadedVideoIds(new Set());
  }, [guest]);

  const isDataLoading = isLoadingGuest || isLoadingTemplates || isLoadingSettings;
  const areAllVideosLoaded = loadedVideoIds.size >= videoBlocks.length;
  const showLoader = isDataLoading || (videoBlocks.length > 0 && !areAllVideosLoaded);

  const PageContent = useMemo(() => {
    if (!guest) return null;
    return (
      <div className="w-full min-h-screen bg-black flex justify-center">
        <div className="w-full max-w-md bg-white min-h-screen shadow-lg relative">
          <div className="flex flex-col">
            {contentBlocks.map((block) => {
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
                    backgroundImage: `url(${block.backgroundImageUrl})`,
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
                                  textTransform: item.isCaps ? 'uppercase' : 'none',
                                }}
                              >
                                {item.isGuestName ? guest.name : (item.isGuestRole ? guest.role : item.text)}
                              </p>
                            ) : (
                              <img 
                                src={item.imageUrl} 
                                alt="Profile item" 
                                style={{ 
                                  width: `${item.width}%`, 
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
            })}
          </div>
        </div>
      </div>
    );
  }, [guest, contentBlocks, handleVideoLoad, imageDimensions]);

  if (isDataLoading) {
    return <CustomLoadingScreen loaderConfig={settings?.loader_config} textConfig={settings?.loading_text_config} />;
  }

  if (!guest) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-[#fff5ea] to-[#e5b899] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white/70 rounded-xl shadow-lg max-w-sm w-full">
          <h1 className="text-2xl font-bold text-red-600">Không tìm thấy Profile</h1>
          <p className="text-slate-600 mt-2">Liên kết có thể đã sai hoặc profile đã bị xóa.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showLoader && (
        <div className="fixed inset-0 w-full h-screen z-50">
          <CustomLoadingScreen loaderConfig={settings?.loader_config} textConfig={settings?.loading_text_config} />
        </div>
      )}
      <div style={{ visibility: showLoader ? 'hidden' : 'visible' }}>
        {PageContent}
      </div>
    </>
  );
};

export default PublicProfile;