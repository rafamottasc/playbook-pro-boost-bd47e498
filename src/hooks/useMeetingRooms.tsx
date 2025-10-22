import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface MeetingRoom {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useMeetingRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("meeting_rooms")
        .select("*")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching meeting rooms:", error);
        toast.error("Erro ao carregar salas de reunião");
        return;
      }

      setRooms(data || []);
    } catch (error) {
      console.error("Error fetching meeting rooms:", error);
      toast.error("Erro ao carregar salas de reunião");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();

    // Realtime subscription para atualizações automáticas
    const channel = supabase
      .channel("meeting-rooms-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meeting_rooms",
        },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    rooms,
    loading,
    refetch: fetchRooms,
  };
}
