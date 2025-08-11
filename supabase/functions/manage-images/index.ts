// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function createErrorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteImage(supabaseAdmin: SupabaseClient, payload: any) {
  const { fileName } = payload;
  if (!fileName) {
    throw new Error("Tên file không được để trống.");
  }

  const { error } = await supabaseAdmin.storage
    .from('avatars')
    .remove([`image-library/${fileName}`]);

  if (error) {
    throw new Error(`Lỗi xóa ảnh: ${error.message}`);
  }

  return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return createErrorResponse('Thiếu biến môi trường của Supabase.', 500);
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    const { method, payload } = await req.json();

    // All requests must be authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Thiếu thông tin xác thực.', 401);
    }

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return createErrorResponse('Xác thực không hợp lệ.', 401);
    }

    // Check user role to ensure only authorized users can delete
    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (profileError || !profile) {
      return createErrorResponse('Không thể lấy thông tin phân quyền.', 403);
    }
    if (!['Admin', 'Quản lý'].includes(profile.role)) {
      return createErrorResponse('Bạn không có quyền thực hiện hành động này.', 403);
    }

    switch (method) {
      case 'DELETE_IMAGE': return await deleteImage(supabaseAdmin, payload);
      default: return createErrorResponse('Phương thức không hợp lệ.', 400);
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return createErrorResponse(error.message || 'Đã xảy ra lỗi không xác định.', 500);
  }
})