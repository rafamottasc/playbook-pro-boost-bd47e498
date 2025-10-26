import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTaskChecklistProgress() {
  // Retorna progresso mockado por enquanto - será integrado quando os componentes estiverem prontos
  const getChecklistProgress = (taskId: string) => {
    return {
      completed: 0,
      total: 0,
    };
  };

  return { getChecklistProgress };
}
