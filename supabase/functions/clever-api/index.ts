
// Deno muhiti uchun
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, x-supabase-client-platform',
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Body bo'sh bo'lsa xato bermasligi uchun
    let body: any = {};
    try {
        body = await req.json();
    } catch (e) {
        body = {};
    }

    const rawToken = Deno.env.get('TSPAY_TOKEN');
    const token = rawToken ? rawToken.trim() : null;
    const merchantId = Deno.env.get('TSPAY_MERCHANT_ID')?.trim() || Deno.env.get('TSPAY_MERCHANT')?.trim() || '';
    const secretKey = Deno.env.get('TSPAY_SECRET_KEY')?.trim() || Deno.env.get('TSPAY_SECRET')?.trim() || '';

    if (!token && (!merchantId || !secretKey)) {
        return new Response(JSON.stringify({ 
            status: 'error', 
            message: "API Token (TSPAY_TOKEN) yoki Merchant ID (TSPAY_MERCHANT_ID) va Secret Key (TSPAY_SECRET_KEY) topilmadi." 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // --- 1. WEBHOOK (To'lov tasdiqlanganda) ---
    // Agar status kelayotgan bo'lsa va bu TsPay-dan bo'lsa
    if (!body.action && (body.pay_status || body.status)) {
      const status = body.pay_status || body.status;
      if (status === 'paid' || status === 'success') {
        const amount = Number(body.amount);
        const comment = body.comment || "";
        const orderId = body.id || body.cheque_id || 0;
        
        // Komment ichidan User ID (UUID) ni qidirib olamiz
        const userIdMatch = comment.match(/([a-f0-9-]{36})/i);
        const userId = userIdMatch ? userIdMatch[1] : null;

        if (userId && amount) {
          // Baza rpc funksiyasini chaqiramiz
          await supabaseAdmin.rpc('record_tspay_success', { 
              u_id: userId, 
              amt: amount, 
              o_id: Number(orderId) 
          });
        }
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: corsHeaders });
    }

    // --- 2. TO'LOV YARATISH (Frontenddan kelgan so'rov) ---
    if (body.action === 'create') {
      const amount = Math.floor(Number(body.amount));
      // Sinalgan URL (oxirida slash bor)
      const TSPAY_API_URL = 'https://tspay.uz/api/v1/transactions/create/';

      const tsResponse = await fetch(TSPAY_API_URL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Accept': 'application/json' 
        },
        body: JSON.stringify({
          amount: amount,
          access_token: token || secretKey,
          merchant_id: merchantId,
          secret_key: secretKey,
          comment: `Anilo.uz: ${body.user_id}`,
          redirect_url: 'https://anilo.uz/dashboard'
        })
      });
      
      const data = await tsResponse.json().catch(() => ({}));
      console.log("TsPay Response Code:", tsResponse.status);

      // Sinalgan URL qidirish mantiqi (Deep Search)
      const findUrlDeep = (obj: any): string | null => {
          if (!obj || typeof obj !== 'object') return null;
          
          const priorityKeys = ['pay_url', 'url', 'payment_url', 'link', 'pay_link', 'payment_page_url', 'checkout_url'];
          for (const key of priorityKeys) {
              if (typeof obj[key] === 'string' && obj[key].startsWith('http')) return obj[key];
          }

          for (const key in obj) {
              if (typeof obj[key] === 'string' && obj[key].startsWith('https://checkout.tspay.uz')) {
                  return obj[key];
              }
              if (typeof obj[key] === 'object') {
                  const found = findUrlDeep(obj[key]);
                  if (found) return found;
              }
          }
          return null;
      };

      const payUrl = findUrlDeep(data);
      const transactionId = data.id || (data.data && data.data.id) || data.cheque_id;

      if ((tsResponse.status === 200 || tsResponse.status === 201) && payUrl) {
          return new Response(JSON.stringify({ 
              status: 'success', 
              transaction: { url: payUrl, id: transactionId } 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      } else {
          const errorMsg = data.message || data.error || `TsPay xatosi: ${tsResponse.status}`;
          return new Response(JSON.stringify({ 
              status: 'error', 
              message: errorMsg
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
    }

    // --- 3. TO'LOVNI TEKSHIRISH ---
    if (body.action === 'check' && body.cheque_id) {
      const response = await fetch(`https://tspay.uz/api/v1/transactions/${body.cheque_id}/?access_token=${token || secretKey}`)
      const data = await response.json();
      return new Response(JSON.stringify({ status: 'success', data }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ status: 'error', message: 'Noma\'lum amal' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
    });

  } catch (error: any) {
    console.error("Critical Function Error:", error);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });
  }
})
