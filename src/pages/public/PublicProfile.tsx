import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { ProfileTemplate } from "@/types/profile-template";

type CombinedGuest = (Guest | VipGuest) & { image_url?: string; profile_content?: any | null };

const PublicProfile = () => {
  const { slug } = useParams();

  // Query 1: Lấy dữ liệu khách mời
  const { data: guest, isLoading: isLoadingGuest, isError: isErrorGuest, error: guestError } = useQuery<CombinedGuest | null>({
    queryKey: ['public_profile_guest_diag_5', slug],
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
    queryKey: ['profile_templates_diag_5'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profile_templates').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Query 3: Lấy cài đặt
  const { data: settings, isLoading: isLoadingSettings, isError: isErrorSettings, error: settingsError } = useQuery({
    queryKey: ['checklist_settings_diag_5'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checklist_settings').select('loader_config, loading_text_config').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const isLoading = isLoadingGuest || isLoadingTemplates || isLoadingSettings;

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg font-bold">Chẩn đoán: Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="p-4 font-mono text-sm space-y-6">
      <div>
        <h1 className="text-lg font-bold mb-2">Chẩn đoán Bước 5: Kết quả truy vấn `guest`</h1>
        <p>isLoading: {isLoadingGuest.toString()}</p>
        <p>isError: {isErrorGuest.toString()}</p>
        {guestError && <p className="text-red-500">Error: {guestError.message}</p>}
        <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap break-all mt-2">
          {JSON.stringify(guest, null, 2)}
        </pre>
      </div>
      <div>
        <h1 className="text-lg font-bold mb-2">Chẩn đoán Bước 5: Kết quả truy vấn `templates`</h1>
        <p>isLoading: {isLoadingTemplates.toString()}</p>
        <p>isError: {isErrorTemplates.toString()}</p>
        {templatesError && <p className="text-red-500">Error: {templatesError.message}</p>}
        <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap break-all mt-2">
          {JSON.stringify(templates, null, 2)}
        </pre>
      </div>
      <div>
        <h1 className="text-lg font-bold mb-2">Chẩn đoán Bước 5: Kết quả truy vấn `settings`</h1>
        <p>isLoading: {isLoadingSettings.toString()}</p>
        <p>isError: {isErrorSettings.toString()}</p>
        {settingsError && <p className="text-red-500">Error: {settingsError.message}</p>}
        <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap break-all mt-2">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default PublicProfile;