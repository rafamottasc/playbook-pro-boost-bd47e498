import { useEffect, useState } from "react";
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
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchMeetings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
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
        return;
      }

      // Formatar dados com informações relacionadas
      const formattedData: Meeting[] = (data || []).map((m: any) => ({
        ...m,
        room_name: m.meeting_rooms?.name || "Sala desconhecida",
        creator_name: m.profiles?.full_name || "Usuário desconhecido",
      }));

      setMeetings(formattedData);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast.error("Erro ao carregar reuniões");
    } finally {
      setLoading(false);
    }
  };

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
      fetchMeetings(); // Atualizar lista
      return meeting;
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast.error("Erro ao criar reunião");
      return null;
    } finally {
      setCreating(false);
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
      fetchMeetings(); // Atualizar lista
      return true;
    } catch (error) {
      console.error("Error cancelling meeting:", error);
      toast.error("Erro ao cancelar reunião");
      return false;
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    fetchMeetings();

    // Realtime subscription para atualizações automáticas
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
          fetchMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, JSON.stringify(options)]);

  return {
    meetings,
    loading,
    creating,
    cancelling,
    refetch: fetchMeetings,
    createMeeting,
    cancelMeeting,
  };
}
