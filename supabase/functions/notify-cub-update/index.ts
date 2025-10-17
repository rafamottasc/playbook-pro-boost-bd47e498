import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Verificar se já existe CUB para o mês atual
    const { data: existing } = await supabase
      .from("cub_values")
      .select("id")
      .eq("month", currentMonth)
      .eq("year", currentYear)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ message: "CUB já cadastrado para este mês" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar todos os admins
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!admins || admins.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum admin encontrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar notificações para todos os admins
    const notifications = admins.map((admin) => ({
      user_id: admin.user_id,
      title: "🔔 Atualizar CUB/SC",
      message: `Lembrete: Cadastre o valor do CUB/SC referente a ${now.toLocaleString("pt-BR", { month: "long", year: "numeric" })}`,
      link: "/admin?tab=calculator",
      type: "system",
    }));

    const { error } = await supabase.from("notifications").insert(notifications);

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: admins.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
