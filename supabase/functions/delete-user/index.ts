import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar autenticação do usuário que está fazendo a requisição
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verificar se o usuário atual é admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      console.error('User verification failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verificar se é admin
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      console.error('User is not admin')
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem deletar usuários' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Obter o userId da requisição
    const { userId } = await req.json()

    if (!userId) {
      console.error('No userId provided')
      return new Response(
        JSON.stringify({ error: 'userId é obrigatório' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Attempting to delete user: ${userId}`)

    // Verificar se não é o primeiro admin
    const { data: profiles } = await supabaseClient
      .from('profiles')
      .select('id, created_at')
      .order('created_at', { ascending: true })

    const { data: adminRoles } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .in('user_id', profiles?.map(p => p.id) || [])

    const firstAdminId = profiles?.find(p => 
      adminRoles?.some(r => r.user_id === p.id)
    )?.id

    if (userId === firstAdminId) {
      console.error('Cannot delete first admin')
      return new Response(
        JSON.stringify({ error: 'O administrador principal não pode ser deletado' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Deletar avatar do storage antes de deletar usuário
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (profile?.avatar_url) {
      const avatarPath = profile.avatar_url.split('/avatars/')[1]
      if (avatarPath) {
        await supabaseClient.storage.from('avatars').remove([avatarPath])
      }
    }

    // Deletar o usuário usando Admin API
    // Isso vai automaticamente deletar o perfil em cascata (ON DELETE CASCADE)
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return new Response(
        JSON.stringify({ error: `Erro ao deletar usuário: ${deleteError.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`User deleted successfully: ${userId}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Usuário deletado com sucesso' 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
