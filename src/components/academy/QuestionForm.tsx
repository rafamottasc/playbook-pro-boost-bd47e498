import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface QuestionFormProps {
  lessonId: string;
}

export function QuestionForm({ lessonId }: QuestionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !question.trim()) return;

    setLoading(true);
    try {
      const { error: questionError } = await supabase
        .from('lesson_questions')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          question: question.trim()
        });

      if (questionError) throw questionError;

      // Buscar module_id da aula para gerar link correto
      const { data: lessonData } = await supabase
        .from('academy_lessons')
        .select('module_id')
        .eq('id', lessonId)
        .single();

      // Get all admins to notify
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles && lessonData) {
        // Create notifications for all admins - redirect to admin panel
        const notifications = adminRoles.map(admin => ({
          user_id: admin.user_id,
          title: "Nova pergunta na Academy",
          message: `${question.substring(0, 50)}...`,
          link: `/admin?tab=academy&subtab=questions`,
          type: "academy_question"
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }

      toast({
        title: "Pergunta enviada!",
        description: "Nossa equipe responderá em breve."
      });

      setQuestion("");
    } catch (error) {
      console.error('Error submitting question:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua pergunta.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 mb-6">
      <div className="flex gap-3">
        <MessageCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="Tem alguma dúvida sobre esta aula? Pergunte aqui..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || !question.trim()}
            className="w-full sm:w-auto"
          >
            Enviar Pergunta
          </Button>
        </div>
      </div>
    </Card>
  );
}
