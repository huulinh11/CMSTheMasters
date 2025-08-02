// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getUserRole(supabaseClient: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    console.error('Error fetching user role:', error?.message);
    return null;
  }
  return data.role;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const userRole = await getUserRole(supabase, user.id);
    const { method, payload } = await req.json();

    // Special case for creating the first user
    if (method === 'CREATE_USER') {
        const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) throw error;
        if (users.users.length === 0) {
            // Allow creation of the first user, force role to Admin
            payload.role = 'Admin';
        } else if (!userRole || !['Admin', 'Quản lý'].includes(userRole)) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
    } else if (!userRole || !['Admin', 'Quản lý'].includes(userRole)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    switch (method) {
      case 'LIST_USERS': {
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
      
      case 'CREATE_USER': {
        const { username, password, full_name, department, role } = payload;
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

      case 'UPDATE_USER': {
        const { id, password, full_name, department, role } = payload;
        
        if (password) {
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

      case 'DELETE_USER': {
        const { id } = payload;
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid method' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})