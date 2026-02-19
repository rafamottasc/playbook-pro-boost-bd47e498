import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem deletar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      return new Response(
        JSON.stringify({ error: 'O administrador principal não pode ser deletado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deletar TODOS os objetos do storage do usuário via Storage API
    // O trigger protect_objects_delete bloqueia DELETE direto via SQL,
    // então precisamos usar a Storage API antes de deletar o usuário
    const buckets = ['avatars', 'resources', 'academy-covers', 'partner-files', 'lesson-materials', 'task-attachments']
    
    for (const bucket of buckets) {
      try {
        // Listar objetos do usuário no bucket
        const { data: objects } = await supabaseClient.storage
          .from(bucket)
          .list(userId, { limit: 1000 })
        
        if (objects && objects.length > 0) {
          const filePaths = objects.map(obj => `${userId}/${obj.name}`)
          console.log(`Deleting ${filePaths.length} objects from bucket ${bucket}`)
          await supabaseClient.storage.from(bucket).remove(filePaths)
        }

        // Também tentar listar na raiz (alguns arquivos podem não estar em pasta do userId)
        const { data: allObjects } = await supabaseClient.storage
          .from(bucket)
          .list('', { limit: 1000 })
        
        if (allObjects) {
          // Filtrar por owner_id não é possível via Storage API,
          // então vamos apenas limpar a pasta do userId
        }
      } catch (e) {
        console.log(`No objects or error in bucket ${bucket}:`, e)
      }
    }

    // Deletar o perfil manualmente primeiro para evitar cascade issues
    const { error: profileDeleteError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileDeleteError) {
      console.error('Error deleting profile:', profileDeleteError)
      return new Response(
        JSON.stringify({ error: `Erro ao deletar perfil: ${profileDeleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Profile deleted, now deleting auth user: ${userId}`)

    // Deletar o usuário usando Admin API
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return new Response(
        JSON.stringify({ error: `Erro ao deletar usuário: ${deleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User deleted successfully: ${userId}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Usuário deletado com sucesso' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})