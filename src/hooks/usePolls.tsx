import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { useEffect } from "react";

export interface PollOption {
  id: string;
  option_text: string;
  display_order: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string | null;
  allow_multiple: boolean;
  options: PollOption[];
  results_cache: any;
}

export interface PollVoteData {
  poll_id: string;
  option_ids: string[];
}

export function usePolls() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch active poll for current user
  const {
    data: activePoll,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["active-poll", user?.id],
    queryFn: async () => {
      if (!user) return null;

      console.log('[usePolls] 🔍 INÍCIO - Buscando enquetes ativas', {
        userId: user.id,
        timestamp: new Date().toISOString()
      });

      const now = new Date();
      const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();

      // Buscar enquetes ativas
      const { data: polls, error: pollError } = await supabase
        .from("polls")
        .select(`
          id,
          title,
          description,
          allow_multiple,
          results_cache,
          options:poll_options(
            id,
            option_text,
            display_order
          )
        `)
        .eq("active", true)
        .gte("end_date", localNow)
        .lte("start_date", localNow)
        .order("created_at", { ascending: false });

      if (pollError) throw pollError;
      if (!polls || polls.length === 0) {
        console.log('[usePolls] ❌ Nenhuma enquete ativa encontrada no banco');
        return null;
      }

      console.log('[usePolls] ✅ Enquetes ativas encontradas:', {
        count: polls.length,
        pollIds: polls.map(p => p.id)
      });

      // Verificar cada enquete até encontrar uma não votada/visualizada
      for (const poll of polls) {
        const { data: vote, error: voteError } = await supabase
          .from("poll_responses")
          .select("option_id")
          .eq("poll_id", poll.id)
          .eq("user_id", user.id);

        const { data: view, error: viewError } = await supabase
          .from("poll_views")
          .select("id")
          .eq("poll_id", poll.id)
          .eq("user_id", user.id);

        // Debug logging
        console.log('[usePolls] 🔎 Verificando poll:', poll.id, {
          pollTitle: poll.title,
          hasVote: vote && vote.length > 0,
          hasView: view && view.length > 0,
          voteCount: vote?.length || 0,
          viewCount: view?.length || 0,
          voteError,
          viewError,
          userId: user.id,
          timestamp: new Date().toISOString()
        });

        // Só retornar se NÃO votou E NÃO visualizou
        if ((!vote || vote.length === 0) && (!view || view.length === 0)) {
          console.log('[usePolls] ✅ ENQUETE ENCONTRADA para exibir:', {
            pollId: poll.id,
            pollTitle: poll.title,
            userId: user.id,
            timestamp: new Date().toISOString()
          });
          poll.options.sort((a: PollOption, b: PollOption) => a.display_order - b.display_order);
          return poll as Poll;
        }
      }

      console.log('[usePolls] ⚠️ Nenhuma enquete disponível para exibir', {
        userId: user.id,
        totalPollsChecked: polls.length,
        timestamp: new Date().toISOString()
      });
      return null;
    },
    enabled: !!user,
    staleTime: 0, // Sempre considerar dados stale para buscar do banco
    gcTime: 1000 * 60 * 10, // 10 minutos
    refetchOnWindowFocus: false,
  });

  // Check if user has voted on a specific poll
  const { data: hasVoted } = useQuery({
    queryKey: ["poll-voted", activePoll?.id, user?.id],
    queryFn: async () => {
      if (!user || !activePoll) return false;

      const { data } = await supabase
        .from("poll_responses")
        .select("option_id")
        .eq("poll_id", activePoll.id)
        .eq("user_id", user.id);

      return data && data.length > 0;
    },
    enabled: !!user && !!activePoll,
    staleTime: Infinity, // Uma vez votado, não muda
  });

  // Submit vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ poll_id, option_ids }: PollVoteData) => {
      if (!user) throw new Error("Usuário não autenticado");

      const responses = option_ids.map((optionId) => ({
        poll_id,
        user_id: user.id,
        option_id: optionId,
      }));

      // Inserir votos
      const { error: voteError } = await supabase
        .from("poll_responses")
        .insert(responses);

      if (voteError) throw voteError;

      // Registrar visualização
      const { error: viewError } = await supabase
        .from("poll_views")
        .upsert(
          { poll_id, user_id: user.id },
          { onConflict: "poll_id,user_id", ignoreDuplicates: true }
        );

      if (viewError) console.error("Erro ao registrar visualização:", viewError);

      // Buscar resultados atualizados
      const { data: updatedPoll } = await supabase
        .from("polls")
        .select("results_cache")
        .eq("id", poll_id)
        .single();

      return updatedPoll;
    },
    onSuccess: async (data, variables) => {
      console.log('[usePolls] 🎯 VOTO REGISTRADO - Iniciando processo:', {
        pollId: variables.poll_id,
        userId: user!.id,
        timestamp: new Date().toISOString()
      });

      queryClient.setQueryData(["poll-voted", variables.poll_id, user?.id], true);
      
      // Garantir que poll_view foi inserida
      const { error: viewError } = await supabase
        .from("poll_views")
        .upsert(
          { poll_id: variables.poll_id, user_id: user!.id },
          { onConflict: "poll_id,user_id", ignoreDuplicates: true }
        );
      
      console.log('[usePolls] 📝 Poll_view inserida:', {
        pollId: variables.poll_id,
        userId: user!.id,
        error: viewError,
        timestamp: new Date().toISOString()
      });
      
      // Forçar enquete como null
      queryClient.setQueryData(["active-poll", user?.id], null);
      
      console.log('[usePolls] 🗑️ Cache local setado para NULL:', {
        userId: user?.id,
        timestamp: new Date().toISOString()
      });

      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ["active-poll", user?.id] });
      
      console.log('[usePolls] 🔄 Cache invalidado, próxima query deve buscar do banco:', {
        userId: user?.id,
        timestamp: new Date().toISOString()
      });

      toast.success("Voto registrado!", {
        description: "Obrigado pela sua participação.",
      });
    },
    onError: (error: any) => {
      console.error("Erro ao enviar voto:", error);

      // Se já votou, marcar como votado no cache
      if (error.message?.includes("já votou") || error.code === "23505") {
        if (user && activePoll) {
          queryClient.setQueryData(["poll-voted", activePoll.id, user.id], true);
          
          // Forçar enquete como null IMEDIATAMENTE
          queryClient.setQueryData(["active-poll", user?.id], null);
          
          // Registrar visualização mesmo assim
          supabase
            .from("poll_views")
            .upsert(
              { poll_id: activePoll.id, user_id: user.id },
              { onConflict: "poll_id,user_id", ignoreDuplicates: true }
            );

          // Invalidar cache para remover enquete da tela
          queryClient.invalidateQueries({ queryKey: ["active-poll", user?.id] });
        }

        toast.error("Você já votou nesta enquete");
      } else {
        toast.error("Erro ao votar", {
          description: error.message || "Tente novamente mais tarde.",
        });
      }
    },
  });

  // Dismiss poll mutation (quando fecha sem votar)
  const dismissMutation = useMutation({
    mutationFn: async (poll_id: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("poll_views")
        .upsert(
          { poll_id, user_id: user.id },
          { onConflict: "poll_id,user_id", ignoreDuplicates: true }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      // Forçar enquete como null IMEDIATAMENTE
      queryClient.setQueryData(["active-poll", user?.id], null);
      
      // Invalidar query para buscar próxima enquete
      queryClient.invalidateQueries({ queryKey: ["active-poll", user?.id] });
    },
    onError: (error) => {
      console.error("Erro ao dispensar enquete:", error);
    },
  });

  // Realtime removido para evitar conflitos com cache local após voto/dismiss

  return {
    activePoll,
    hasVoted: hasVoted ?? false,
    isLoading,
    isVoting: voteMutation.isPending,
    isDismissing: dismissMutation.isPending,
    refetch,
    vote: voteMutation.mutate,
    dismiss: dismissMutation.mutate,
  };
}
