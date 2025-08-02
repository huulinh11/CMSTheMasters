// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- Action Handlers ---

async function listUsers(supabaseAdmin: SupabaseClient) {
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    const { data: profiles, error: profilesError } = await supabaseAdmin.from('profiles').select('*');
    if (profilesError) throw profilesError;

    const combined = users.map(u => {
      const profile = profiles.find(p => p.id === u.id);
      return {
        id: u.id,
        email: u.email,
        username: u.email?.split('@')[0],
        ...profile,
      };
    });
    return new Response(JSON.stringify(combined), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function createUser(supabaseAdmin: SupabaseClient, payload: any) {
    const { username, password, full_name, department, role } = payload;
    if (!password || password.length < 6) {
      throw new Error("Mật khẩu phải có ít nhất 6 ký tự.");
    }
    const email = `${username}@event.app`;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, department, role }
    });

    if (error) throw error;
    return new Response(JSON.stringify(data.user), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function updateUser(supabaseAdmin: SupabaseClient, payload: any) {
    const { id, password, full_name, department, role } = payload;
    
    if (password) {
      if (password.length < 6) {
        throw new Error("Mật khẩu phải có ít nhất 6 ký tự.");
      }
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
      if (authError) throw authError;
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ full_name, department, role })
      .eq('id', id);
    if (profileError) throw profileError;

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function deleteUser(supabaseAdmin: SupabaseClient, payload: any) {
    const { id } = payload;
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}


// --- Main Server ---

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Could not retrieve user profile.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!['Admin', 'Quản lý'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    switch (method) {
      case 'LIST_USERS': return await listUsers(supabaseAdmin);
      case 'CREATE_USER': return await createUser(supabaseAdmin, payload);
      case 'UPDATE_USER': return await updateUser(supabaseAdmin, payload);
      case 'DELETE_USER': return await deleteUser(supabaseAdmin, payload);
      default: 
        return new Response(JSON.stringify({ error: 'Invalid method' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})