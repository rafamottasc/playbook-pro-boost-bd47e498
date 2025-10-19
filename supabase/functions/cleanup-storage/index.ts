import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupResult {
  bucket: string;
  filesDeleted: number;
  spaceFreeBytes: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    console.log('🧹 Iniciando limpeza automática de storage...');

    const results: CleanupResult[] = [];

    // ============================================
    // 1️⃣ Bucket: partner-files
    // ============================================
    const partnerFilesResult = await cleanupBucket({
      supabase,
      bucketName: 'partner-files',
      tableName: 'partner_files',
      urlColumn: 'file_url',
    });
    results.push(partnerFilesResult);

    // ============================================
    // 2️⃣ Bucket: lesson-materials
    // ============================================
    const lessonMaterialsResult = await cleanupBucket({
      supabase,
      bucketName: 'lesson-materials',
      tableName: 'lesson_attachments',
      urlColumn: 'file_url',
    });
    results.push(lessonMaterialsResult);

    // ============================================
    // 3️⃣ Bucket: academy-covers
    // ============================================
    const academyCoversResult = await cleanupBucket({
      supabase,
      bucketName: 'academy-covers',
      tableName: 'academy_modules',
      urlColumn: 'cover_url',
      whereClause: 'cover_url IS NOT NULL',
    });
    results.push(academyCoversResult);

    // ============================================
    // 4️⃣ Bucket: resources
    // ============================================
    const resourcesResult = await cleanupBucket({
      supabase,
      bucketName: 'resources',
      tableName: 'resources',
      urlColumn: 'url',
      whereClause: "resource_type = 'file'",
    });
    results.push(resourcesResult);

    // ============================================
    // 5️⃣ Bucket: avatars
    // ============================================
    const avatarsResult = await cleanupBucket({
      supabase,
      bucketName: 'avatars',
      tableName: 'profiles',
      urlColumn: 'avatar_url',
      whereClause: 'avatar_url IS NOT NULL',
    });
    results.push(avatarsResult);

    // ============================================
    // 📊 Salvar log no banco (SEM notificação)
    // ============================================
    const totalDeleted = results.reduce((sum, r) => sum + r.filesDeleted, 0);
    const totalSpaceFreed = results.reduce((sum, r) => sum + r.spaceFreeBytes, 0);

    await supabase.from('storage_cleanup_logs').insert({
      files_deleted: totalDeleted,
      space_freed_bytes: totalSpaceFreed,
      details: { buckets: results },
    });

    console.log('✅ Limpeza concluída:', {
      totalDeleted,
      totalSpaceMB: (totalSpaceFreed / 1024 / 1024).toFixed(2),
    });

    return new Response(
      JSON.stringify({
        success: true,
        totalDeleted,
        totalSpaceFreedMB: (totalSpaceFreed / 1024 / 1024).toFixed(2),
        buckets: results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================
// 🔧 Função auxiliar genérica de limpeza
// ============================================
async function cleanupBucket({
  supabase,
  bucketName,
  tableName,
  urlColumn,
  whereClause = 'TRUE',
}: {
  supabase: any;
  bucketName: string;
  tableName: string;
  urlColumn: string;
  whereClause?: string;
}): Promise<CleanupResult> {
  const result: CleanupResult = {
    bucket: bucketName,
    filesDeleted: 0,
    spaceFreeBytes: 0,
    errors: [],
  };

  try {
    console.log(`\n🗂️ Processando bucket: ${bucketName}`);

    // 1. Listar TODOS os arquivos no storage
    const { data: storageFiles, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

    if (listError) {
      result.errors.push(`Erro ao listar ${bucketName}: ${listError.message}`);
      return result;
    }

    if (!storageFiles || storageFiles.length === 0) {
      console.log(`  ℹ️ Nenhum arquivo encontrado em ${bucketName}`);
      return result;
    }

    // Buscar recursivamente subpastas (formato: partnerId/arquivo.pdf)
    const allFiles: string[] = [];
    for (const item of storageFiles) {
      if (item.id === null) {
        // É uma pasta, listar conteúdo
        const { data: subFiles } = await supabase.storage
          .from(bucketName)
          .list(item.name, { limit: 1000 });
        
        if (subFiles) {
          subFiles.forEach((file: any) => {
            if (file.id) {
              allFiles.push(`${item.name}/${file.name}`);
            }
          });
        }
      } else {
        allFiles.push(item.name);
      }
    }

    console.log(`  📁 Total de arquivos no storage: ${allFiles.length}`);

    // 2. Buscar URLs válidas do banco de dados
    const { data: dbRecords, error: dbError } = await supabase
      .from(tableName)
      .select(urlColumn)
      .neq(urlColumn, null);

    if (dbError) {
      result.errors.push(`Erro ao consultar ${tableName}: ${dbError.message}`);
      return result;
    }

    // Extrair paths válidos das URLs
    const validPaths = new Set<string>();
    dbRecords?.forEach((record: any) => {
      const url = record[urlColumn];
      if (url) {
        // Extrai path: .../bucket/path/file.jpg → path/file.jpg
        const match = url.match(new RegExp(`${bucketName}/(.+)$`));
        if (match) {
          validPaths.add(match[1]);
        }
      }
    });

    console.log(`  ✅ Arquivos válidos no banco: ${validPaths.size}`);

    // 3. Identificar órfãos (storage - banco)
    const orphans = allFiles.filter((path) => {
      // Ignora placeholder do bucket avatars
      if (bucketName === 'avatars' && path === '.emptyFolderPlaceholder') {
        return false;
      }
      return !validPaths.has(path);
    });

    console.log(`  🗑️ Arquivos órfãos identificados: ${orphans.length}`);

    // 4. Deletar órfãos
    for (const orphan of orphans) {
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([orphan]);

      if (deleteError) {
        result.errors.push(`Erro ao deletar ${orphan}: ${deleteError.message}`);
      } else {
        result.filesDeleted++;
        // Estimar tamanho (assumindo média de 100KB por arquivo)
        result.spaceFreeBytes += 100 * 1024;
        console.log(`    ✓ Deletado: ${orphan}`);
      }
    }

    console.log(`  ✅ Concluído: ${result.filesDeleted} arquivos removidos`);
  } catch (error) {
    result.errors.push(`Erro geral em ${bucketName}: ${error.message}`);
  }

  return result;
}
