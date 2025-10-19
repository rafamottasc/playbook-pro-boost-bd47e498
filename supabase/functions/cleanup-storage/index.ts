import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupResult {
  bucket: string;
  orphansFound: number;
  orphansDeleted: number;
  errors: string[];
  files: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🧹 Iniciando limpeza automática de storage...');

    // Configuração dos buckets e suas respectivas tabelas/colunas
    const bucketsConfig = [
      {
        bucket: 'partner-files',
        table: 'partner_files',
        urlColumn: 'file_url'
      },
      {
        bucket: 'lesson-materials',
        table: 'lesson_attachments',
        urlColumn: 'file_url'
      },
      {
        bucket: 'academy-covers',
        table: 'academy_modules',
        urlColumn: 'cover_url'
      },
      {
        bucket: 'resources',
        table: 'resources',
        urlColumn: 'url'
      },
      {
        bucket: 'avatars',
        table: 'profiles',
        urlColumn: 'avatar_url'
      }
    ];

    const results: CleanupResult[] = [];
    let totalOrphansDeleted = 0;

    // Processar cada bucket
    for (const config of bucketsConfig) {
      console.log(`\n📦 Processando bucket: ${config.bucket}`);
      
      const result: CleanupResult = {
        bucket: config.bucket,
        orphansFound: 0,
        orphansDeleted: 0,
        errors: [],
        files: []
      };

      try {
        // 1. Listar todos os arquivos no storage
        const { data: storageFiles, error: storageError } = await supabase
          .storage
          .from(config.bucket)
          .list('', {
            limit: 1000,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (storageError) {
          console.error(`❌ Erro ao listar ${config.bucket}:`, storageError);
          result.errors.push(`Storage error: ${storageError.message}`);
          results.push(result);
          continue;
        }

        if (!storageFiles || storageFiles.length === 0) {
          console.log(`✅ Bucket ${config.bucket} vazio ou sem arquivos`);
          results.push(result);
          continue;
        }

        console.log(`📂 Encontrados ${storageFiles.length} arquivos no storage`);

        // 2. Buscar todas as URLs válidas no banco
        const { data: dbRecords, error: dbError } = await supabase
          .from(config.table)
          .select(config.urlColumn);

        if (dbError) {
          console.error(`❌ Erro ao buscar ${config.table}:`, dbError);
          result.errors.push(`Database error: ${dbError.message}`);
          results.push(result);
          continue;
        }

        // Extrair paths válidos das URLs
        const validPaths = new Set<string>();
        if (dbRecords) {
          for (const record of dbRecords) {
            const url = (record as any)[config.urlColumn] as string | null;
            if (url) {
              // Extrair path: /storage/v1/object/public/bucket/path → path
              const pathMatch = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
              if (pathMatch) {
                validPaths.add(pathMatch[1]);
              }
            }
          }
        }

        console.log(`✅ ${validPaths.size} arquivos válidos no banco`);

        // 3. Identificar órfãos
        const orphanFiles: string[] = [];
        for (const file of storageFiles) {
          // Ignorar placeholder de pastas vazias
          if (file.name === '.emptyFolderPlaceholder') {
            continue;
          }

          // Processar subpastas recursivamente
          if (file.id === null) {
            // É uma pasta, listar conteúdo
            const { data: subFiles } = await supabase
              .storage
              .from(config.bucket)
              .list(file.name, { limit: 100 });

            if (subFiles) {
              for (const subFile of subFiles) {
                if (subFile.name === '.emptyFolderPlaceholder') continue;
                
                const fullPath = `${file.name}/${subFile.name}`;
                if (!validPaths.has(fullPath)) {
                  orphanFiles.push(fullPath);
                }
              }
            }
          } else {
            // É arquivo direto na raiz
            if (!validPaths.has(file.name)) {
              orphanFiles.push(file.name);
            }
          }
        }

        result.orphansFound = orphanFiles.length;
        console.log(`🔍 Órfãos encontrados: ${orphanFiles.length}`);

        // 4. Deletar órfãos
        if (orphanFiles.length > 0) {
          const { data: deleteData, error: deleteError } = await supabase
            .storage
            .from(config.bucket)
            .remove(orphanFiles);

          if (deleteError) {
            console.error(`❌ Erro ao deletar órfãos:`, deleteError);
            result.errors.push(`Delete error: ${deleteError.message}`);
          } else {
            result.orphansDeleted = orphanFiles.length;
            result.files = orphanFiles;
            totalOrphansDeleted += orphanFiles.length;
            console.log(`🗑️ Deletados ${orphanFiles.length} órfãos de ${config.bucket}`);
          }
        }

      } catch (error) {
        console.error(`❌ Erro ao processar ${config.bucket}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(errorMessage);
      }

      results.push(result);
    }

    // 5. Salvar log de limpeza
    const { error: logError } = await supabase
      .from('storage_cleanup_logs')
      .insert({
        files_deleted: totalOrphansDeleted,
        space_freed_bytes: 0, // Não temos info de tamanho
        details: { results }
      });

    if (logError) {
      console.error('❌ Erro ao salvar log:', logError);
    }

    console.log(`\n✅ Limpeza concluída! Total deletado: ${totalOrphansDeleted} arquivos`);

    return new Response(
      JSON.stringify({
        success: true,
        totalOrphansDeleted,
        results,
        message: `Limpeza concluída. ${totalOrphansDeleted} arquivos órfãos removidos.`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
