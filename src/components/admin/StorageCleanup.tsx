import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, Database, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";

interface CleanupLog {
  id: string;
  executed_by: string;
  files_deleted: number;
  space_freed_bytes: number;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export function StorageCleanup() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const { data: cleanupLogs, refetch } = useQuery({
    queryKey: ["cleanup-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_cleanup_logs")
        .select(`
          *,
          profiles (full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as CleanupLog[];
    },
  });

  const handleCleanup = async () => {
    setIsLoading(true);
    setShowConfirmDialog(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase.functions.invoke("cleanup-orphaned-files", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setLastResult(data);
      refetch();

      toast({
        title: "✅ Limpeza concluída!",
        description: `${data.filesDeleted} arquivos deletados (${data.spaceFreedMB} MB liberados)`,
      });
    } catch (error: any) {
      console.error("Erro na limpeza:", error);
      toast({
        title: "Erro na limpeza",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Limpeza de Storage
          </CardTitle>
          <CardDescription>
            Remove arquivos órfãos que não têm registros no banco de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>O que será deletado:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Avatares sem usuário associado</li>
                <li>• Arquivos de parceiros deletados</li>
                <li>• Capas de módulos removidos</li>
                <li>• PDFs e materiais de aulas excluídas</li>
                <li>• Recursos sem registro no sistema</li>
              </ul>
              <p className="mt-2 text-muted-foreground">
                ⚠️ Arquivos em uso <strong>NÃO</strong> serão afetados.
              </p>
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={isLoading}
            variant="destructive"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Limpando storage...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Executar Limpeza Manual
              </>
            )}
          </Button>

          {lastResult && (
            <Alert>
              <AlertDescription>
                <strong>Última limpeza:</strong> {lastResult.filesDeleted} arquivos deletados ({lastResult.spaceFreedMB} MB liberados)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Limpezas</CardTitle>
          <CardDescription>
            Últimas 10 execuções automáticas e manuais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cleanupLogs?.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {log.files_deleted} arquivos deletados
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(log.space_freed_bytes / 1024 / 1024).toFixed(2)} MB liberados • {" "}
                    {new Date(log.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Por: {log.profiles?.full_name || "Sistema"}
                  </p>
                </div>
              </div>
            ))}
            {!cleanupLogs || cleanupLogs.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma limpeza executada ainda
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Limpeza de Storage</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá deletar PERMANENTEMENTE todos os arquivos órfãos
              (sem registro no banco de dados) de todos os buckets do sistema.
              <br /><br />
              Arquivos em uso não serão afetados. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCleanup} className="bg-destructive">
              Executar Limpeza
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
