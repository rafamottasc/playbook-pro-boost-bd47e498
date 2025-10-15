import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Stage {
  id: string;
  funnel_id: string;
  name: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useStages(funnelId?: string) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStages = async () => {
    if (!funnelId) {
      setStages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("playbook_stages")
        .select("*")
        .eq("funnel_id", funnelId)
        .order("display_order");

      if (error) throw error;
      setStages(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar etapas:", error);
      toast({
        title: "Erro ao carregar etapas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();

    if (!funnelId) return;

    // Realtime subscription
    const channel = supabase
      .channel("playbook_stages_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "playbook_stages",
          filter: `funnel_id=eq.${funnelId}`,
        },
        () => {
          fetchStages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [funnelId]);

  const createStage = async (data: { name: string; funnel_id: string }) => {
    try {
      const { error } = await supabase.from("playbook_stages").insert([data]);

      if (error) throw error;

      toast({
        title: "Etapa criada!",
        description: `${data.name} foi criada com sucesso.`,
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao criar etapa",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const updateStage = async (id: string, data: Partial<Stage>) => {
    try {
      const { error } = await supabase
        .from("playbook_stages")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Etapa atualizada!",
        description: "As alterações foram salvas.",
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar etapa",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const deleteStage = async (id: string, stageName: string) => {
    try {
      // Check for messages
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("stage_name", stageName);

      if (count && count > 0) {
        toast({
          title: "Não é possível deletar",
          description: `Esta etapa tem ${count} mensagens associadas.`,
          variant: "destructive",
        });
        return { success: false, error: "HAS_MESSAGES", count };
      }

      const { error } = await supabase
        .from("playbook_stages")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Etapa deletada!",
        description: "A etapa foi removida com sucesso.",
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao deletar etapa",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const reorderStages = async (reorderedStages: Stage[]) => {
    try {
      const updates = reorderedStages.map((stage, index) => ({
        id: stage.id,
        display_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from("playbook_stages")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
      }

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao reordenar etapas",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    stages,
    loading,
    refetch: fetchStages,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
  };
}
