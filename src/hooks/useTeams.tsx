import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Team {
  id: string;
  name: string;
  emoji: string;
  active: boolean;
  display_order: number;
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();

    // Realtime subscription para mudanças
    const channel = supabase
      .channel('teams_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
        },
        () => {
          loadTeams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("teams")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setTeams(data || []);
    }

    setLoading(false);
  };

  return { teams, loading, error, refetch: loadTeams };
}
