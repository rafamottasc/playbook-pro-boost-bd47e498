import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface LessonFeedbackProps {
  lessonId: string;
}

export function LessonFeedback({ lessonId }: LessonFeedbackProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<{ was_useful: boolean; comment: string } | null>(null);
  const [wasUseful, setWasUseful] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFeedback();
    }
  }, [user, lessonId]);

  const fetchFeedback = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('lesson_feedback')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (data) {
        setFeedback(data);
        setWasUseful(data.was_useful);
        setComment(data.comment || "");
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user || wasUseful === null) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('lesson_feedback')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          was_useful: wasUseful,
          comment: comment.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Obrigado pelo feedback!",
        description: "Sua avaliação nos ajuda a melhorar."
      });

      fetchFeedback();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar seu feedback.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (feedback) {
    return (
      <Card className="p-4 bg-accent/50">
        <p className="text-sm text-muted-foreground">
          Você já avaliou esta aula como{" "}
          <span className="font-semibold">
            {feedback.was_useful ? "útil" : "não útil"}
          </span>
          {feedback.comment && (
            <>
              {" "}e comentou: "{feedback.comment}"
            </>
          )}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-dashed">
      <p className="text-sm text-muted-foreground mb-3">Esta aula foi útil?</p>
      
      <div className="flex gap-2 mb-3">
        <Button
          variant={wasUseful === true ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => setWasUseful(true)}
        >
          <ThumbsUp className="h-3 w-3 mr-1" />
          Sim
        </Button>
        <Button
          variant={wasUseful === false ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => setWasUseful(false)}
        >
          <ThumbsDown className="h-3 w-3 mr-1" />
          Não
        </Button>
      </div>

      {wasUseful !== null && (
        <div className="space-y-2">
          <Textarea
            placeholder="Deixe um comentário (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <Button onClick={handleSubmit} disabled={loading} size="sm" className="w-full">
            Enviar
          </Button>
        </div>
      )}
    </Card>
  );
}
