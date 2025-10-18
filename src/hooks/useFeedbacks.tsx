import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

export type FeedbackType = "suggestion" | "complaint";
export type FeedbackCategory = 
  | "system" 
  | "service" 
  | "campaigns" 
  | "leadership" 
  | "resources" 
  | "academy" 
  | "coworkers" 
  | "infrastructure" 
  | "other";

export type FeedbackStatus = "pending" | "read" | "analyzing" | "resolved" | "archived";

export interface Feedback {
  id: string;
  type: FeedbackType;
  category: FeedbackCategory;
  message: string;
  status: FeedbackStatus;
  team: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackFilters {
  type?: FeedbackType;
  category?: FeedbackCategory;
  status?: FeedbackStatus;
  period?: number; // days
}

export function useFeedbacks() {
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = async (data: {
    type: FeedbackType;
    category: FeedbackCategory;
    message: string;
    includeTeam?: boolean;
  }) => {
    setSubmitting(true);

    try {
      let team = null;

      // Only fetch team if user wants to include it
      if (data.includeTeam) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("team")
            .eq("id", user.id)
            .single();
          team = profile?.team || null;
        }
      }

      const { error } = await supabase
        .from("anonymous_feedbacks")
        .insert({
          type: data.type,
          category: data.category,
          message: data.message,
          team,
        });

      if (error) throw error;

      toast({
        title: "Feedback enviado!",
        description: "Obrigado por compartilhar suas ideias. Sua mensagem foi enviada anonimamente.",
      });

      return { success: true };
    } catch (error: any) {
      logger.error("Erro ao enviar feedback", { 
        action: "submit_feedback", 
        metadata: { error: error?.message } 
      });
      toast({
        title: "Erro",
        description: "Não foi possível enviar seu feedback. Tente novamente.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setSubmitting(false);
    }
  };

  const fetchFeedbacks = async (filters?: FeedbackFilters): Promise<Feedback[]> => {
    try {
      let query = supabase
        .from("anonymous_feedbacks")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.type) {
        query = query.eq("type", filters.type);
      }

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.period) {
        const date = new Date();
        date.setDate(date.getDate() - filters.period);
        // Usar timezone local para comparação (sem converter para UTC)
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
        query = query.gte("created_at", localDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []) as Feedback[];
    } catch (error: any) {
      logger.error("Erro ao buscar feedbacks", { 
        action: "fetch_feedbacks", 
        metadata: { error: error?.message } 
      });
      toast({
        title: "Erro",
        description: "Não foi possível carregar os feedbacks.",
        variant: "destructive",
      });
      return [];
    }
  };

  const updateFeedbackStatus = async (id: string, status: FeedbackStatus) => {
    try {
      const { error } = await supabase
        .from("anonymous_feedbacks")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: "O status do feedback foi atualizado com sucesso.",
      });

      return { success: true };
    } catch (error: any) {
      logger.error("Erro ao atualizar status do feedback", { 
        action: "update_feedback_status", 
        metadata: { error: error?.message, feedbackId: id, status } 
      });
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const updateFeedbackNotes = async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from("anonymous_feedbacks")
        .update({ admin_notes: notes })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Notas salvas",
        description: "As notas internas foram salvas com sucesso.",
      });

      return { success: true };
    } catch (error: any) {
      logger.error("Erro ao atualizar notas do feedback", { 
        action: "update_feedback_notes", 
        metadata: { error: error?.message, feedbackId: id } 
      });
      toast({
        title: "Erro",
        description: "Não foi possível salvar as notas.",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const deleteFeedback = async (id: string) => {
    try {
      const { error } = await supabase
        .from("anonymous_feedbacks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Feedback excluído",
        description: "O feedback foi excluído permanentemente.",
      });

      return { success: true };
    } catch (error: any) {
      logger.error("Erro ao excluir feedback", { 
        action: "delete_feedback", 
        metadata: { error: error?.message, feedbackId: id } 
      });
      toast({
        title: "Erro",
        description: "Não foi possível excluir o feedback.",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  return {
    submitting,
    submitFeedback,
    fetchFeedbacks,
    updateFeedbackStatus,
    updateFeedbackNotes,
    deleteFeedback,
  };
}
