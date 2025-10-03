import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, CheckCircle2, Trash2 } from "lucide-react";

interface Suggestion {
  id: string;
  suggestion_text: string;
  status: string;
  created_at: string;
  message_id: string;
  user_id: string;
  profiles: {
    full_name: string;
  };
  messages: {
    title: string;
  };
}

export function SuggestionsManager() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from("suggestions")
        .select(`
          *,
          profiles(full_name),
          messages(title)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar sugestões",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("suggestions")
        .update({ status: "approved" })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Sugestão aprovada!" });
      loadSuggestions();
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar sugestão",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("suggestions")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Sugestão rejeitada!" });
      loadSuggestions();
    } catch (error: any) {
      toast({
        title: "Erro ao rejeitar sugestão",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMarkAsApplied = async (id: string) => {
    try {
      const { error } = await supabase
        .from("suggestions")
        .update({ status: "applied" })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Sugestão marcada como aplicada!" });
      loadSuggestions();
    } catch (error: any) {
      toast({
        title: "Erro ao marcar sugestão",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMarkAsDiscarded = async (id: string) => {
    try {
      const { error } = await supabase
        .from("suggestions")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Sugestão marcada como descartada!" });
      loadSuggestions();
    } catch (error: any) {
      toast({
        title: "Erro ao marcar sugestão",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta sugestão?")) return;

    try {
      const { error } = await supabase
        .from("suggestions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Sugestão excluída com sucesso!" });
      loadSuggestions();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir sugestão",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (suggestions.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Sugestões dos Corretores</h2>
        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="text-4xl">💡</div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Nenhuma sugestão ainda</h3>
              <p className="text-muted-foreground text-sm">
                Quando os corretores enviarem sugestões de melhoria nas mensagens, elas aparecerão aqui para você aprovar ou rejeitar.
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-sm text-left space-y-2">
              <p className="font-medium">Preview de como as sugestões aparecerão:</p>
              <div className="bg-background p-3 rounded border">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">Pendente</Badge>
                  <span className="text-sm text-muted-foreground">01/01/2024</span>
                </div>
                <p className="font-semibold text-sm mb-1">Mensagem: Saudação Inicial</p>
                <p className="text-xs text-muted-foreground mb-2">Por: João Silva</p>
                <p className="text-xs bg-muted p-2 rounded">
                  Sugestão de melhoria para a mensagem...
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Sugestões dos Corretores</h2>
      
      <div className="grid gap-4">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant={
                      suggestion.status === "pending"
                        ? "default"
                        : suggestion.status === "approved"
                        ? "default"
                        : suggestion.status === "applied"
                        ? "default"
                        : "destructive"
                    }
                    className={
                      suggestion.status === "applied"
                        ? "bg-green-600 hover:bg-green-700"
                        : suggestion.status === "rejected"
                        ? "bg-gray-500 hover:bg-gray-600"
                        : ""
                    }
                  >
                    {suggestion.status === "pending"
                      ? "Pendente"
                      : suggestion.status === "approved"
                      ? "Pendente"
                      : suggestion.status === "applied"
                      ? "✓ Aplicada"
                      : "✗ Descartada"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(suggestion.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <h3 className="font-semibold mb-1">
                  Mensagem: {suggestion.messages?.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Por: {suggestion.profiles?.full_name}
                </p>
                <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                  {suggestion.suggestion_text}
                </p>
              </div>
              
              <div className="flex flex-col gap-2">
                {(suggestion.status === "pending" || suggestion.status === "approved") && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleMarkAsApplied(suggestion.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Aplicada
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsDiscarded(suggestion.id)}
                      className="border-gray-400 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Descartada
                    </Button>
                  </>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(suggestion.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
