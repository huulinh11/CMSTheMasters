// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to create a standardized JSON error response
function createErrorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// --- Action Handlers with individual error handling ---

async function listUsers(supabaseAdmin: SupabaseClient, requesterRole: string) {
  const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  if (usersError) throw new Error(`Lỗi lấy danh sách người dùng: ${usersError.message}`);

  const { data: profiles, error: profilesError } = await supabaseAdmin.from('profiles').select('*');
  if (profilesError) throw new Error(`Lỗi lấy hồ sơ người dùng: ${profilesError.message}`);

  let combined = users.map(u => {
    const profile = profiles.find(p => p.id === u.id);
    return {
      id: u.id,
      email: u.email,
      username: u.email?.split('@')[0],
      ...profile,
    };
  });

  // If requester is 'QL ekip', filter out 'Admin' and 'Quản lý'
  if (requesterRole === 'QL ekip') {
    combined = combined.filter(u => u.role !== 'Admin' && u.role !== 'Quản lý');
  }

  return new Response(JSON.stringify(combined), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function createUser(supabaseAdmin: SupabaseClient, payload: any, requesterRole: string) {
  const { username, password, full_name, department, role } = payload;
  if (!password || password.length < 6) throw new Error("Mật khẩu phải có ít nhất 6 ký tự.");
  if (!username) throw new Error("Username không được để trống.");
  
  // 'QL ekip' can only create 'Nhân viên'
  if (requesterRole === 'QL ekip' && role !== 'Nhân viên') {
    throw new Error("Bạn chỉ có quyền tạo tài khoản loại 'Nhân viên'.");
  }
  
  const email = `${username}@event.app`;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, department, role }
  });

  if (error) throw new Error(`Không thể tạo người dùng: ${error.message}`);
  return new Response(JSON.stringify(data.user), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function updateUser(supabaseAdmin: SupabaseClient, payload: any, requesterRole: string) {
  const { id, password, full_name, department, role } = payload;
  
  if (requesterRole === 'QL ekip') {
    const { data: targetProfile, error } = await supabaseAdmin.from('profiles').select('role').eq('id', id).single();
    if (error) throw new Error(`Không tìm thấy hồ sơ người dùng: ${error.message}`);
    if (targetProfile.role === 'Admin' || targetProfile.role === 'Quản lý') {
      throw new Error("Bạn không có quyền chỉnh sửa tài khoản này.");
    }
    // Prevent promotion to a higher role
    if (role && (role === 'Admin' || role === 'Quản lý' || role === 'QL ekip')) {
        throw new Error("Bạn không có quyền gán vai trò này.");
    }
  }
  
  if (password) {
    if (password.length < 6) throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự.");
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
    if (authError) throw new Error(`Lỗi cập nhật mật khẩu: ${authError.message}`);
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ full_name, department, role })
    .eq('id', id);
  if (profileError) throw new Error(`Lỗi cập nhật hồ sơ: ${profileError.message}`);

  return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function deleteUser(supabaseAdmin: SupabaseClient, payload: any, requesterRole: string) {
  const { id } = payload;

  // 'QL ekip' cannot delete 'Admin' or 'Quản lý'
  if (requesterRole === 'QL ekip') {
    const { data: targetProfile, error } = await supabaseAdmin.from('profiles').select('role').eq('id', id).single();
    if (error) throw new Error(`Không tìm thấy hồ sơ người dùng: ${error.message}`);
    if (targetProfile.role === 'Admin' || targetProfile.role === 'Quản lý') {
      throw new Error("Bạn không có quyền xóa tài khoản này.");
    }
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) throw new Error(`Lỗi xóa người dùng: ${error.message}`);
  return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// --- Main Server Logic ---

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

    // Unauthenticated bootstrap for the very first user
    if (method === 'CREATE_USER') {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (listError) throw listError;
      if (users.length === 0) {
        return await createUser(supabaseAdmin, { ...payload, role: 'Admin' });
      }
    }

    // Authenticated requests
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

    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (profileError || !profile) {
      return createErrorResponse('Không thể lấy thông tin phân quyền.', 403);
    }
    if (!['Admin', 'Quản lý', 'QL ekip'].includes(profile.role)) {
      return createErrorResponse('Bạn không có quyền thực hiện hành động này.', 403);
    }

    const requesterRole = profile.role;

    switch (method) {
      case 'LIST_USERS': return await listUsers(supabaseAdmin, requesterRole);
      case 'CREATE_USER': return await createUser(supabaseAdmin, payload, requesterRole);
      case 'UPDATE_USER': return await updateUser(supabaseAdmin, payload, requesterRole);
      case 'DELETE_USER': return await deleteUser(supabaseAdmin, payload, requesterRole);
      default: return createErrorResponse('Phương thức không hợp lệ.', 400);
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return createErrorResponse(error.message || 'Đã xảy ra lỗi không xác định.', 500);
  }
})