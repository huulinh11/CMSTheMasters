// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set.");
      return new Response(JSON.stringify({ error: "Email configuration missing." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { record } = await req.json();

    const emailHtml = `
      <h1>Yêu cầu xử lý link mới</h1>
      <p>Một yêu cầu mới cần được duyệt:</p>
      <ul>
        <li><strong>Tên cung cấp:</strong> ${record.provided_name}</li>
        <li><strong>SĐT cung cấp:</strong> ${record.provided_phone}</li>
        <li><strong>Link cũ:</strong> ${record.requested_slug}</li>
        <li><strong>Thời gian:</strong> ${new Date(record.created_at).toLocaleString('vi-VN')}</li>
      </ul>
      <p>Vui lòng truy cập trang quản trị để duyệt yêu cầu.</p>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Event App <onboarding@resend.dev>',
        to: ['huulinh11@gmail.com'],
        subject: 'Yêu cầu xử lý link mới cần duyệt',
        html: emailHtml,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
})