import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitRequest {
  identifier: string; // email or IP
  action: 'login' | 'signup';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { identifier, action }: RateLimitRequest = await req.json();

    if (!identifier || !action) {
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          error: 'Missing identifier or action' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago

    // Check attempts in the last 15 minutes
    const { data: attempts, error: fetchError } = await supabase
      .from('rate_limit_attempts')
      .select('*')
      .eq('identifier', identifier)
      .eq('action', action)
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching attempts:', fetchError);
      return new Response(
        JSON.stringify({ 
          allowed: true, // Fail open on error
          warning: 'Rate limit check failed' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const attemptCount = attempts?.length || 0;
    const maxAttempts = action === 'login' ? 5 : 3; // 5 for login, 3 for signup

    // Check if blocked
    if (attemptCount >= maxAttempts) {
      console.log(`Rate limit exceeded for ${identifier} (${action}): ${attemptCount} attempts`);
      
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          remainingAttempts: 0,
          resetTime: new Date(attempts[0].created_at).getTime() + 15 * 60 * 1000,
          message: `Muitas tentativas. Aguarde 15 minutos.`
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record this attempt
    const { error: insertError } = await supabase
      .from('rate_limit_attempts')
      .insert({
        identifier,
        action,
        created_at: now.toISOString(),
      });

    if (insertError) {
      console.error('Error recording attempt:', insertError);
    }

    return new Response(
      JSON.stringify({ 
        allowed: true,
        remainingAttempts: maxAttempts - attemptCount - 1,
        message: 'Request allowed'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Rate limit error:', error);
    return new Response(
      JSON.stringify({ 
        allowed: true, // Fail open
        error: 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
