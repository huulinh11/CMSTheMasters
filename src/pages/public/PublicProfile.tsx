import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { useMemo, useState, useEffect } from "react";
import { ContentBlock, TextBlock } from "@/types/profile-content";
import { Loader2 } from "lucide-react";
import { ProfileTemplate } from "@/types/profile-template";
import { VideoBlockPlayer } from "@/components/public-profile/VideoBlockPlayer";

type CombinedGuest = (Guest | VipGuest) & { image_url?: string; profile_content?: ContentBlock[] | null };

const PublicProfile = () => {
  const { slug } = useParams();
  const [loadedVideoIds, setLoadedVideoIds] = useState(new Set<string>());

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

  const { contentBlocks, activeTemplate } = useMemo(() => {
    if (!guest) {
      return { contentBlocks: [], activeTemplate: null };
    }

    let content: ContentBlock[] | null = null;
    let template: ProfileTemplate | null = null;

    if (guest.profile_content && guest.profile_content.length > 0) {
      content = guest.profile_content;
    } 
    else if (guest.template_id) {
      template = templates.find(t => t.id === guest.template_id) || null;
      if (template) {
        content = template.content;
      }
    } 
    else {
      template = templates.find(t => t.assigned_roles?.includes(guest.role)) || null;
      if (template) {
        content = template.content;
      }
    }

    if (template && content) {
        const userContentMap = new Map((guest.profile_content || []).map((b) => [b.id, b]));
        const mergedContent = (content || []).map((templateBlock): ContentBlock => {
            const userBlock = userContentMap.get(templateBlock.id);
            if (!userBlock || userBlock.type !== templateBlock.type) {
                return templateBlock;
            }
    
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
        return { contentBlocks: mergedContent, activeTemplate: template };
    }

    return { contentBlocks: content || [], activeTemplate: null };
  }, [guest, templates]);

  const videoBlocks = useMemo(() => contentBlocks.filter(b => b.type === 'video'), [contentBlocks]);

  const handleVideoLoad = (videoId: string) => {
    setLoadedVideoIds(prev => new Set(prev).add(videoId));
  };

  useEffect(() => {
    setLoadedVideoIds(new Set());
  }, [guest]);

  const isDataLoading = isLoadingGuest || isLoadingTemplates;
  const areAllVideosLoaded = loadedVideoIds.size >= videoBlocks.length;
  const showLoader = isDataLoading || (videoBlocks.length > 0 && !areAllVideosLoaded);

  const PageContent = () => (
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
                              {item.isGuestName ? guest?.name : item.text}
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
        {activeTemplate && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            Template: {activeTemplate.name}
          </div>
        )}
      </div>
    </div>
  );

  if (isDataLoading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-[#fff5ea] to-[#e5b899] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
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
        <div className="fixed inset-0 w-full h-screen bg-gradient-to-br from-[#fff5ea] to-[#e5b899] flex items-center justify-center z-50">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}
      <div style={{ visibility: showLoader ? 'hidden' : 'visible' }}>
        <PageContent />
      </div>
    </>
  );
};

export default PublicProfile;