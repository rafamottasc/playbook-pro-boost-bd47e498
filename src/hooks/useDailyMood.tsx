import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export type MoodType = "otimo" | "bem" | "neutro" | "cansado" | "dificil";

export function useDailyMood() {
  const { user } = useAuth();
  const [hasAnsweredToday, setHasAnsweredToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      checkIfAnsweredToday();
    }
  }, [user]);

  const checkIfAnsweredToday = async () => {
    if (!user) return;

    try {
      const today = new Date().toLocaleDateString('en-CA');
      
      const { data, error } = await supabase
        .from("daily_mood")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (error) throw error;

      setHasAnsweredToday(!!data);
    } catch (error) {
      console.error("Error checking daily mood:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitMood = async (mood: MoodType) => {
    if (!user) return;

    setSubmitting(true);

    try {
      // Get user's team from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("team")
        .eq("id", user.id)
        .single();

      const today = new Date().toLocaleDateString('en-CA');

      const { error } = await supabase
        .from("daily_mood")
        .upsert({
          user_id: user.id,
          mood,
          date: today,
          team: profile?.team || null,
        }, {
          onConflict: "user_id,date"
        });

      if (error) throw error;

      setHasAnsweredToday(true);
      
      toast({
        title: "Obrigado!",
        description: "Seu humor foi registrado com sucesso.",
      });
    } catch (error) {
      console.error("Error submitting mood:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar seu humor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    hasAnsweredToday,
    loading,
    submitting,
    submitMood,
  };
}
