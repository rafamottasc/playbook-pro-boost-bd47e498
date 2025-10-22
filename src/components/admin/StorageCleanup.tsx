import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function StorageCleanup() {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const executeCleanup = async () => {
    setLoading(true);
    setLastResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-storage');
      
      if (error) throw error;
      
      setLastResult(data);
      
      toast({
        title: "✅ Limpeza concluída!",
        description: `${data.totalOrphansDeleted} arquivos órfãos foram removidos.`,
      });
    } catch (error: any) {
      console.error("Erro na limpeza:", error);
      toast({
        title: "❌ Erro na limpeza",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Limpeza de Storage</h2>
        <p className="text-muted-foreground">
          Remova arquivos órfãos que não estão mais vinculados ao sistema.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Executar Limpeza Manual
          </CardTitle>
          <CardDescription>
            Remove arquivos que foram deletados do banco mas ainda ocupam espaço no storage.
            A limpeza automática roda toda segunda-feira às 3h da manhã.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <Button 
              onClick={executeCleanup} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Limpando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Executar Limpeza Agora
                </>
              )}
            </Button>

            {lastResult && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2 mt-2">
                    <p className="font-medium">
                      {lastResult.totalOrphansDeleted} arquivos órfãos removidos
                    </p>
                    
                    {lastResult.results && lastResult.results.length > 0 && (
                      <div className="text-sm space-y-2">
                        {lastResult.results.map((result: any, index: number) => (
                          <div key={index} className="border-l-2 border-primary pl-3">
                            <p className="font-medium">{result.bucket}</p>
                            <p className="text-muted-foreground">
                              {result.orphansDeleted} de {result.orphansFound} órfãos removidos
                            </p>
                            {result.errors.length > 0 && (
                              <p className="text-destructive text-xs">
                                Erros: {result.errors.join(", ")}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
            <p className="font-medium">📦 Buckets verificados:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>partner-files (Arquivos de construtoras)</li>
              <li>lesson-materials (Materiais de aulas)</li>
              <li>academy-covers (Capas de módulos)</li>
              <li>resources (Recursos e documentos)</li>
              <li>avatars (Fotos de perfil)</li>
            </ul>
            
            <p className="font-medium mt-4">🗓️ Limpeza automática:</p>
            <p className="pl-2">
              O sistema executa a limpeza automaticamente toda segunda-feira às 3h da manhã.
              Você pode executar manualmente a qualquer momento usando o botão acima.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
