import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

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

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhuma sugestão encontrada</p>
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
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {suggestion.status === "pending"
                      ? "Pendente"
                      : suggestion.status === "approved"
                      ? "Aprovada"
                      : "Rejeitada"}
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
              {suggestion.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="default"
                    onClick={() => handleApprove(suggestion.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleReject(suggestion.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
