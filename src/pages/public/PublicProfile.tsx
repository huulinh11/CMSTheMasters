import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { ProfileTemplate } from "@/types/profile-template";
import { useMemo } from "react";
import { ContentBlock, TextBlockItem } from "@/types/profile-content";

type CombinedGuest = (Guest | VipGuest) & { image_url?: string; profile_content?: ContentBlock[] | null };

const PublicProfile = () => {
  const { slug } = useParams();

  // Query 1: Lấy dữ liệu khách mời
  const { data: guest, isLoading: isLoadingGuest, isError: isErrorGuest, error: guestError } = useQuery<CombinedGuest | null>({
    queryKey: ['public_profile_guest_diag_3', slug],
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

  // Query 2: Lấy danh sách templates
  const { data: templates, isLoading: isLoadingTemplates, isError: isErrorTemplates, error: templatesError } = useQuery<ProfileTemplate[]>({
    queryKey: ['profile_templates_diag_3'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profile_templates').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Logic hợp nhất dữ liệu được thêm lại ở đây
  const contentBlocks = useMemo(() => {
    if (!guest || !templates) {
      return [];
    }
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

      return templateContent.map((templateBlock): ContentBlock => {
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
              const userItems = (Array.isArray(userBlock.items) ? userBlock.items : []) as TextBlockItem[];
              const templateItems = (Array.isArray(templateBlock.items) ? templateBlock.items : []) as TextBlockItem[];
              const userItemsMap = new Map(userItems.map(item => [item.id, item]));

              const mergedItems = templateItems.map((templateItem): TextBlockItem => {
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
    }
    return userContent;
  }, [guest, templates]);

  const isLoading = isLoadingGuest || isLoadingTemplates;
  const isError = isErrorGuest || isErrorTemplates;
  const error = guestError || templatesError;

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg">Đang tải và xử lý dữ liệu...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div>
          <h1 className="text-xl font-bold text-red-700">Lỗi tải dữ liệu</h1>
          <pre className="mt-2 text-sm text-red-600 bg-red-100 p-2 rounded">{error?.message}</pre>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-yellow-50 p-4">
        <h1 className="text-xl font-bold text-yellow-700">Không tìm thấy profile cho slug: "{slug}"</h1>
      </div>
    );
  }

  return (
    <div className="p-4 font-mono text-sm space-y-4">
      <div>
        <h1 className="text-lg font-bold mb-2">Dữ liệu khách mời (Chẩn đoán bước 3)</h1>
        <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap break-all">
          {JSON.stringify(guest, null, 2)}
        </pre>
      </div>
      <div>
        <h1 className="text-lg font-bold mb-2">Dữ liệu Templates (Chẩn đoán bước 3)</h1>
        <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap break-all">
          {JSON.stringify(templates, null, 2)}
        </pre>
      </div>
      <div>
        <h1 className="text-lg font-bold mb-2">Kết quả Content Blocks (Chẩn đoán bước 3)</h1>
        <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap break-all">
          {JSON.stringify(contentBlocks, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default PublicProfile;