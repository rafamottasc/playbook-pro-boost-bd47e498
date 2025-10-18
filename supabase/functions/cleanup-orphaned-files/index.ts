import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrphanedFile {
  bucket: string;
  path: string;
  size?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar se usuário é admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Sem autorização');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: isAdmin } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      throw new Error('Apenas admins podem executar limpeza');
    }

    console.log('🧹 Iniciando limpeza de arquivos órfãos...');
    const orphanedFiles: OrphanedFile[] = [];

    // 1. Buscar avatars órfãos
    console.log('📸 Verificando avatars...');
    const { data: avatarsList } = await supabaseClient.storage.from('avatars').list();
    const { data: profiles } = await supabaseClient.from('profiles').select('avatar_url');
    
    const usedAvatars = new Set(
      profiles?.map(p => p.avatar_url?.split('/avatars/')[1]).filter(Boolean) || []
    );

    for (const file of avatarsList || []) {
      if (!usedAvatars.has(file.name)) {
        orphanedFiles.push({ bucket: 'avatars', path: file.name, size: file.metadata?.size });
      }
    }

    // 2. Buscar partner-files órfãos
    console.log('🏢 Verificando partner-files...');
    const { data: partnerFilesList } = await supabaseClient.storage.from('partner-files').list();
    const { data: partnerFiles } = await supabaseClient.from('partner_files').select('file_url');
    
    const usedPartnerFiles = new Set(
      partnerFiles?.map(p => p.file_url.split('/partner-files/')[1]).filter(Boolean) || []
    );

    for (const file of partnerFilesList || []) {
      if (!usedPartnerFiles.has(file.name)) {
        orphanedFiles.push({ bucket: 'partner-files', path: file.name, size: file.metadata?.size });
      }
    }

    // 3. Buscar academy-covers órfãos
    console.log('📚 Verificando academy-covers...');
    const { data: coversList } = await supabaseClient.storage.from('academy-covers').list();
    const { data: modules } = await supabaseClient.from('academy_modules').select('cover_url');
    
    const usedCovers = new Set(
      modules?.map(m => m.cover_url?.split('/academy-covers/')[1]).filter(Boolean) || []
    );

    for (const file of coversList || []) {
      if (!usedCovers.has(file.name)) {
        orphanedFiles.push({ bucket: 'academy-covers', path: file.name, size: file.metadata?.size });
      }
    }

    // 4. Buscar resources órfãos (PDFs e imagens)
    console.log('📄 Verificando resources...');
    const { data: resourcesList } = await supabaseClient.storage.from('resources').list();
    const { data: resources } = await supabaseClient.from('resources').select('url');
    
    const usedResources = new Set(
      resources?.map(r => r.url.split('/resources/')[1]).filter(Boolean) || []
    );

    for (const file of resourcesList || []) {
      if (!usedResources.has(file.name)) {
        orphanedFiles.push({ bucket: 'resources', path: file.name, size: file.metadata?.size });
      }
    }

    // 5. Buscar lesson-materials órfãos
    console.log('🎓 Verificando lesson-materials...');
    const { data: materialsList } = await supabaseClient.storage.from('lesson-materials').list();
    const { data: attachments } = await supabaseClient.from('lesson_attachments').select('file_url');
    
    const usedMaterials = new Set(
      attachments?.map(a => a.file_url.split('/lesson-materials/')[1]).filter(Boolean) || []
    );

    for (const file of materialsList || []) {
      if (!usedMaterials.has(file.name)) {
        orphanedFiles.push({ bucket: 'lesson-materials', path: file.name, size: file.metadata?.size });
      }
    }

    console.log(`🗑️ Encontrados ${orphanedFiles.length} arquivos órfãos`);

    // Deletar arquivos órfãos
    let deletedCount = 0;
    let totalSpaceFreed = 0;

    for (const file of orphanedFiles) {
      const { error } = await supabaseClient.storage.from(file.bucket).remove([file.path]);
      
      if (!error) {
        deletedCount++;
        totalSpaceFreed += file.size || 0;
        console.log(`✅ Deletado: ${file.bucket}/${file.path}`);
      } else {
        console.error(`❌ Erro ao deletar ${file.bucket}/${file.path}:`, error);
      }
    }

    // Salvar log da limpeza
    await supabaseClient.from('storage_cleanup_logs').insert({
      executed_by: user.id,
      files_deleted: deletedCount,
      space_freed_bytes: totalSpaceFreed,
      details: orphanedFiles.map(f => ({ bucket: f.bucket, path: f.path, size: f.size }))
    });

    // Criar notificação para admins
    const { data: admins } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    for (const admin of admins || []) {
      await supabaseClient.from('notifications').insert({
        user_id: admin.user_id,
        title: '🧹 Limpeza de Storage Concluída',
        message: `${deletedCount} arquivos órfãos deletados (${(totalSpaceFreed / 1024 / 1024).toFixed(2)} MB liberados)`,
        type: 'system',
        link: '/admin'
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        filesDeleted: deletedCount,
        spaceFreedMB: (totalSpaceFreed / 1024 / 1024).toFixed(2),
        details: orphanedFiles
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erro na limpeza:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
