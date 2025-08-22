import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { ContentBlock, TextBlock } from "@/types/profile-content";
import { ProfileTemplate } from "@/types/profile-template";
import { VideoBlockPlayer } from "@/components/public-profile/VideoBlockPlayer";
import CustomLoadingScreen from "@/components/public-profile/CustomLoadingScreen";
import DuplicateSlugResolver from "./DuplicateSlugResolver";

type CombinedGuest = (Guest | VipGuest) & { image_url?: string; profile_content?: ContentBlock[] | null };

const DESIGN_WIDTH = 420;

const PublicProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'found' | 'not_found' | 'resolution_needed'>('loading');
  const [guest, setGuest] = useState<CombinedGuest | null>(null);
  
  const [loadedVideoIds, setLoadedVideoIds] = useState(new Set<string>());
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  const { data: templates, isLoading: isLoadingTemplates } = useQuery<ProfileTemplate[]>({
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

  useEffect(() => {
    const resolveSlug = async () => {
      if (!slug) {
        setStatus('not_found');
        return;
      }

      // Step 1: Check for a direct slug match (new, stable format)
      const slugParts = slug.split('-');
      const guestId = slugParts[slugParts.length - 1];
      
      const { data: directGuest } = await supabase.from('vip_guests').select('*').eq('slug', slug).single();
      if (directGuest) {
        setGuest(directGuest as VipGuest);
        setStatus('found');
        return;
      }
      const { data: directRegularGuest } = await supabase.from('guests').select('*').eq('slug', slug).single();
      if (directRegularGuest) {
        setGuest(directRegularGuest as Guest);
        setStatus('found');
        return;
      }

      // Step 2: Check for an alias match in the new table
      const { data: alias } = await supabase.from('slug_aliases').select('guest_id, guest_type').eq('old_slug', slug).single();
      if (alias) {
        const tableName = alias.guest_type === 'vip' ? 'vip_guests' : 'guests';
        const { data: aliasedGuest } = await supabase.from(tableName).select('*').eq('id', alias.guest_id).single();
        if (aliasedGuest) {
          navigate(`/profile/${aliasedGuest.slug}`, { replace: true });
          return;
        }
      }

      // Step 3: Try name-based lookup for legacy slugs
      const namePart = slug.substring(0, slug.lastIndexOf('-'));
      const { data: vipMatches } = await supabase.from('vip_guests').select('id, name, slug').ilike('slug', `${namePart}-%`);
      const { data: regularMatches } = await supabase.from('guests').select('id, name, slug').ilike('slug', `${namePart}-%`);
      const allMatches = [...(vipMatches || []), ...(regularMatches || [])];

      if (allMatches.length === 1) {
        // Found a single match, create an alias and redirect
        const matchedGuest = allMatches[0];
        const guestType = (vipMatches || []).some(g => g.id === matchedGuest.id) ? 'vip' : 'regular';
        await supabase.from('slug_aliases').insert({ old_slug: slug, guest_id: matchedGuest.id, guest_type: guestType });
        navigate(`/profile/${matchedGuest.slug}`, { replace: true });
      } else if (allMatches.length > 1) {
        // Multiple matches, needs user resolution
        setStatus('resolution_needed');
      } else {
        // No matches found
        setStatus('not_found');
      }
    };

    setStatus('loading');
    resolveSlug();
  }, [slug, navigate]);

  const contentBlocks = useMemo(() => {
    if (!guest || !templates) return [];
    const userContent = Array.isArray(guest.profile_content) ? guest.profile_content : [];
    
    let activeTemplate: ProfileTemplate | null = null;
    if (guest.template_id) {
      activeTemplate = templates.find(t => t.id === guest.template_id) || null;
    }
    if (!activeTemplate) {
      activeTemplate = templates.find(t => t.assigned_roles?.includes(guest.role)) || null;
    }

    if (activeTemplate) {
      const templateContent = Array.isArray(activeTemplate.content) ? activeTemplate.content : [];
      const userContentMap = new Map(userContent.map((b) => [b.id, b]));

      return templateContent.map((templateBlock): ContentBlock | null => {
        if (!templateBlock) return null;
        const userBlock = userContentMap.get(templateBlock.id);
        if (!userBlock || userBlock.type !== templateBlock.type) return templateBlock;
        
        switch (templateBlock.type) {
          case 'image':
            if (userBlock.type === 'image') return { ...templateBlock, imageUrl: userBlock.imageUrl, linkUrl: userBlock.linkUrl };
            break;
          case 'video':
            if (userBlock.type === 'video') return { ...templateBlock, videoUrl: userBlock.videoUrl };
            break;
          case 'text':
            if (userBlock.type === 'text') {
              const userItems = Array.isArray(userBlock.items) ? userBlock.items : [];
              const templateItems = Array.isArray(templateBlock.items) ? templateBlock.items : [];
              const userItemsMap = new Map(userItems.map(item => [item.id, item]));
              const mergedItems = templateItems.map(templateItem => {
                const userItem = userItemsMap.get(templateItem.id);
                if (!userItem || userItem.type !== templateItem.type) return templateItem;
                if (templateItem.type === 'text' && userItem.type === 'text') return { ...templateItem, text: userItem.text };
                if (templateItem.type === 'image' && userItem.type === 'image') return { ...templateItem, imageUrl: userItem.imageUrl };
                return templateItem;
              });
              return { ...templateBlock, items: mergedItems };
            }
            break;
        }
        return templateBlock;
      }).filter((b): b is ContentBlock => b !== null);
    }
    return userContent;
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
      if (prev.has(videoId)) return prev;
      const newSet = new Set(prev);
      newSet.add(videoId);
      return newSet;
    });
  }, []);

  useEffect(() => {
    setLoadedVideoIds(new Set());
  }, [guest]);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const width = entries[0].contentRect.width;
        setScaleFactor(width / DESIGN_WIDTH);
      }
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  if (status === 'loading' || isLoadingTemplates || isLoadingSettings) {
    return <CustomLoadingScreen loaderConfig={settings?.loader_config} textConfig={settings?.loading_text_config} />;
  }

  if (status === 'resolution_needed' && slug) {
    return <DuplicateSlugResolver slug={slug} />;
  }

  if (status === 'not_found' || !guest) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-[#fff5ea] to-[#e5b899] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white/70 rounded-xl shadow-lg max-w-sm w-full">
          <h1 className="text-2xl font-bold text-red-600">Không tìm thấy Profile</h1>
          <p className="text-slate-600 mt-2">Liên kết có thể đã sai hoặc profile đã bị xóa.</p>
        </div>
      </div>
    );
  }

  const areAllVideosLoaded = loadedVideoIds.size >= videoBlocks.length;
  const showContentLoader = videoBlocks.length > 0 && !areAllVideosLoaded;

  return (
    <>
      {showContentLoader && (
        <div className="fixed inset-0 w-full h-screen z-50">
          <CustomLoadingScreen loaderConfig={settings?.loader_config} textConfig={settings?.loading_text_config} />
        </div>
      )}
      <div style={{ visibility: showContentLoader ? 'hidden' : 'visible' }}>
        <div className="w-full min-h-screen bg-black flex justify-center items-center">
          <div ref={containerRef} className="w-full max-w-[420px] bg-white shadow-lg relative">
            <div className="flex flex-col">
              {contentBlocks.map((block) => {
                if (!block) return null;
                switch (block.type) {
                  case 'image':
                    const imageElement = <img src={block.imageUrl} alt="Profile content" className="h-auto object-cover w-full" />;
                    return (
                      <div key={block.id} className="w-full flex justify-center" style={{ width: `${block.width || 100}%`, margin: '0 auto' }}>
                        {block.linkUrl ? (
                          <a href={block.linkUrl} target="_blank" rel="noopener noreferrer" className="w-full">
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
                                  marginTop: `${(item.marginTop || 0) * scaleFactor}px`,
                                  marginRight: `${(item.marginRight || 0) * scaleFactor}px`,
                                  marginBottom: `${(item.marginBottom || 0) * scaleFactor}px`,
                                  marginLeft: `${(item.marginLeft || 0) * scaleFactor}px`,
                                }}
                              >
                                {item.type === 'text' ? (
                                  <p
                                    className="text-center"
                                    style={{
                                      fontSize: `${(item.fontSize || 32) * scaleFactor}px`,
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