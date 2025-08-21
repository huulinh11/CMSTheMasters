import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";

type CombinedGuest = (Guest | VipGuest) & { profile_content?: any | null };

const PublicProfile = () => {
  const { slug } = useParams();

  const { data: guest, isLoading, isError, error } = useQuery<CombinedGuest | null>({
    queryKey: ['public_profile_guest_diagnostic_final', slug],
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

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg font-bold">Chẩn đoán: Đang tải dữ liệu khách mời...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div>
          <h1 className="text-xl font-bold text-red-700">Chẩn đoán: Lỗi tải dữ liệu</h1>
          <pre className="mt-2 text-sm text-red-600 bg-red-100 p-2 rounded">{error.message}</pre>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-yellow-50 p-4">
        <h1 className="text-xl font-bold text-yellow-700">Chẩn đoán: Không tìm thấy profile cho slug: "{slug}"</h1>
      </div>
    );
  }

  return (
    <div className="p-4 font-mono text-sm space-y-4">
      <div>
        <h1 className="text-lg font-bold mb-2">Chẩn đoán: Dữ liệu `guest` đầy đủ</h1>
        <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap break-all">
          {JSON.stringify(guest, null, 2)}
        </pre>
      </div>
      <div>
        <h1 className="text-lg font-bold mb-2">Chẩn đoán: Dữ liệu `profile_content` riêng lẻ</h1>
        <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap break-all">
          {JSON.stringify(guest.profile_content, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default PublicProfile;