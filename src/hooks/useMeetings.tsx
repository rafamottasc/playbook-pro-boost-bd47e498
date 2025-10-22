import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  room_id: string;
  start_date: string;
  end_date: string;
  created_by: string;
  participants_count: number;
  status: "confirmed" | "pending" | "cancelled";
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  // Dados relacionados (preenchidos via join)
  room_name?: string;
  creator_name?: string;
}

interface UseMeetingsOptions {
  startDate?: Date;
  endDate?: Date;
  roomId?: string;
  status?: "confirmed" | "pending" | "cancelled";
  limit?: number;
}

interface CreateMeetingData {
  title: string;
  description?: string;
  room_id: string;
  start_date: Date;
  end_date: Date;
  participants_count: number;
}

interface CancelMeetingData {
  meeting_id: string;
  cancellation_reason?: string;
}

export function useMeetings(options: UseMeetingsOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Criar query key única baseada nas opções
  const queryKey = ["meetings", user?.id, options];

  // Função de fetch otimizada
  const fetchMeetings = async (): Promise<Meeting[]> => {
    if (!user) return [];

    let query = supabase
      .from("meetings")
      .select(`
        *,
        meeting_rooms!meetings_room_id_fkey(name),
        profiles!meetings_created_by_fkey(full_name)
      `)
      .order("start_date", { ascending: true });

    // Aplicar filtros
    if (options.startDate) {
      query = query.gte("start_date", options.startDate.toISOString());
    }
    if (options.endDate) {
      query = query.lte("start_date", options.endDate.toISOString());
    }
    if (options.roomId) {
      query = query.eq("room_id", options.roomId);
    }
    if (options.status) {
      query = query.eq("status", options.status);
    } else {
      // Por padrão, mostrar apenas confirmadas
      query = query.eq("status", "confirmed");
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching meetings:", error);
      toast.error("Erro ao carregar reuniões");
      throw error;
    }

    // Formatar dados com informações relacionadas
    return (data || []).map((m: any) => ({
      ...m,
      room_name: m.meeting_rooms?.name || "Sala desconhecida",
      creator_name: m.profiles?.full_name || "Usuário desconhecido",
    }));
  };

  // Usar React Query para cache e gerenciamento de estado
  const { 
    data: meetings = [], 
    isLoading: loading,
    refetch 
  } = useQuery({
    queryKey,
    queryFn: fetchMeetings,
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // Cache válido por 2 minutos
    gcTime: 1000 * 60 * 5, // Garbage collection após 5 minutos
    refetchOnWindowFocus: true, // Atualizar ao voltar para a aba
  });

  const createMeeting = async (data: CreateMeetingData) => {
    if (!user) {
      toast.error("Você precisa estar autenticado");
      return null;
    }

    setCreating(true);
    try {
      const { data: meeting, error } = await supabase
        .from("meetings")
        .insert({
          title: data.title,
          description: data.description || null,
          room_id: data.room_id,
          start_date: data.start_date.toISOString(),
          end_date: data.end_date.toISOString(),
          created_by: user.id,
          participants_count: data.participants_count,
          status: "confirmed",
        })
        .select()
        .single();

      if (error) {
        // Verificar se é erro de conflito de horário
        if (error.message.includes("Conflito de horário")) {
          toast.error("Esta sala já está reservada neste horário");
        } else {
          console.error("Error creating meeting:", error);
          toast.error("Erro ao criar reunião");
        }
        return null;
      }

      toast.success("Reunião criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["meetings", user.id] });
      return meeting;
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast.error("Erro ao criar reunião");
      return null;
    } finally {
      setCreating(false);
    }
  };

  const updateMeeting = async (meeting_id: string, data: Partial<CreateMeetingData>) => {
    if (!user) {
      toast.error("Você precisa estar autenticado");
      return null;
    }

    setUpdating(true);
    try {
      const updateData: any = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.room_id !== undefined) updateData.room_id = data.room_id;
      if (data.start_date !== undefined) updateData.start_date = data.start_date.toISOString();
      if (data.end_date !== undefined) updateData.end_date = data.end_date.toISOString();
      if (data.participants_count !== undefined) updateData.participants_count = data.participants_count;

      const { data: meeting, error } = await supabase
        .from("meetings")
        .update(updateData)
        .eq("id", meeting_id)
        .select()
        .single();

      if (error) {
        if (error.message.includes("Conflito de horário")) {
          toast.error("Esta sala já está reservada neste horário");
        } else {
          console.error("Error updating meeting:", error);
          toast.error("Erro ao atualizar reunião");
        }
        return null;
      }

      toast.success("Reunião atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["meetings", user.id] });
      return meeting;
    } catch (error) {
      console.error("Error updating meeting:", error);
      toast.error("Erro ao atualizar reunião");
      return null;
    } finally {
      setUpdating(false);
    }
  };

  const cancelMeeting = async ({ meeting_id, cancellation_reason }: CancelMeetingData) => {
    if (!user) {
      toast.error("Você precisa estar autenticado");
      return false;
    }

    setCancelling(true);
    try {
      const { error } = await supabase
        .from("meetings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: cancellation_reason || null,
        })
        .eq("id", meeting_id);

      if (error) {
        console.error("Error cancelling meeting:", error);
        toast.error("Erro ao cancelar reunião");
        return false;
      }

      toast.success("Reunião cancelada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["meetings", user.id] });
      return true;
    } catch (error) {
      console.error("Error cancelling meeting:", error);
      toast.error("Erro ao cancelar reunião");
      return false;
    } finally {
      setCancelling(false);
    }
  };

  // Realtime subscription para atualizações automáticas
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("meetings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meetings",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["meetings", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    meetings,
    loading,
    creating,
    updating,
    cancelling,
    refetch: fetchMeetings,
    createMeeting,
    updateMeeting,
    cancelMeeting,
  };
}
