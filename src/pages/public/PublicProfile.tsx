import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";

type CombinedGuest = (Guest | VipGuest) & { image_url?: string; profile_content?: any | null };

const PublicProfile = () => {
  const { slug } = useParams();

  const { data: guest, isLoading, isError, error } = useQuery<CombinedGuest | null>({
    queryKey: ['public_profile_guest_simple', slug],
    queryFn: async () => {
        if (!slug) return null;
        // Thử tìm trong vip_guests trước
        const { data: vipGuest } = await supabase.from('vip_guests').select('*').eq('slug', slug).single();
        if (vipGuest) return vipGuest as VipGuest;
        
        // Nếu không thấy, tìm trong guests
        const { data: regularGuest } = await supabase.from('guests').select('*').eq('slug', slug).single();
        if (regularGuest) return regularGuest as Guest;

        return null;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg">Đang tải dữ liệu khách mời...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div>
          <h1 className="text-xl font-bold text-red-700">Lỗi tải dữ liệu</h1>
          <pre className="mt-2 text-sm text-red-600 bg-red-100 p-2 rounded">{error.message}</pre>
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
    <div className="p-4 font-mono text-sm">
      <h1 className="text-lg font-bold mb-4">Dữ liệu thô của khách mời (Chế độ chẩn đoán)</h1>
      <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap break-all">
        {JSON.stringify(guest, null, 2)}
      </pre>
    </div>
  );
};

export default PublicProfile;