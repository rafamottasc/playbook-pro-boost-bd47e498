import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Funnel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  emoji: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useFunnels() {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFunnels = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("playbook_funnels")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setFunnels(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar funis:", error);
      toast({
        title: "Erro ao carregar funis",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFunnels();

    // Realtime subscription
    const channel = supabase
      .channel("playbook_funnels_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "playbook_funnels",
        },
        () => {
          fetchFunnels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFunnels]);

  const createFunnel = async (data: {
    name: string;
    slug: string;
    description?: string;
    emoji?: string;
  }) => {
    try {
      const { error } = await supabase.from("playbook_funnels").insert([data]);

      if (error) throw error;

      toast({
        title: "Funil criado!",
        description: `${data.name} foi criado com sucesso.`,
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao criar funil",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const updateFunnel = async (id: string, data: Partial<Funnel>) => {
    try {
      const { error } = await supabase
        .from("playbook_funnels")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Funil atualizado!",
        description: "As alterações foram salvas.",
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar funil",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const deleteFunnel = async (id: string) => {
    try {
      // Check for stages
      const { count: stagesCount } = await supabase
        .from("playbook_stages")
        .select("*", { count: "exact", head: true })
        .eq("funnel_id", id);

      if (stagesCount && stagesCount > 0) {
        toast({
          title: "Não é possível deletar",
          description: `Este funil tem ${stagesCount} etapas. Delete as etapas primeiro.`,
          variant: "destructive",
        });
        return { success: false, error: "HAS_STAGES" };
      }

      const { error } = await supabase
        .from("playbook_funnels")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Funil deletado!",
        description: "O funil foi removido com sucesso.",
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao deletar funil",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const reorderFunnels = async (reorderedFunnels: Funnel[]) => {
    try {
      const updates = reorderedFunnels.map((funnel, index) => ({
        id: funnel.id,
        display_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from("playbook_funnels")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
      }

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao reordenar funis",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    funnels,
    loading,
    refetch: fetchFunnels,
    createFunnel,
    updateFunnel,
    deleteFunnel,
    reorderFunnels,
  };
}
