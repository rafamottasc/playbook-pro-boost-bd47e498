import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, Edit, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Question {
  id: string;
  question: string;
  answer: string | null;
  created_at: string;
  user_id: string;
  lesson_id: string;
  module_id: string;
  lesson: {
    title: string;
    module: {
      title: string;
    };
  };
  user: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function QuestionsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('pending');
  const [loading, setLoading] = useState(true);
  const [answeringQuestion, setAnsweringQuestion] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editAnswerText, setEditAnswerText] = useState("");

  useEffect(() => {
    fetchQuestions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('questions-admin-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lesson_questions'
        },
        () => {
          fetchQuestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const fetchQuestions = async () => {
    try {
      let query = supabase
        .from('lesson_questions')
        .select(`
          *,
          academy_lessons!inner(
            id,
            title,
            module_id,
            academy_modules!inner(
              id,
              title
            )
          ),
          profiles!lesson_questions_user_id_fkey(full_name, avatar_url)
        `);

      if (filter === 'pending') {
        query = query.is('answer', null);
      } else if (filter === 'answered') {
        query = query.not('answer', 'is', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const formattedQuestions = (data || []).map((q: any) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        created_at: q.created_at,
        user_id: q.user_id,
        lesson_id: q.lesson_id,
        module_id: q.academy_lessons.module_id,
        lesson: {
          title: q.academy_lessons.title,
          module: {
            title: q.academy_lessons.academy_modules.title
          }
        },
        user: q.profiles
      }));

      setQuestions(formattedQuestions);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (questionId: string, question: Question) => {
    if (!user || !answerText.trim()) return;

    try {
      const { error: updateError } = await supabase
        .from('lesson_questions')
        .update({
          answer: answerText.trim(),
          answered_by: user.id,
          answered_at: new Date().toISOString()
        })
        .eq('id', questionId);

      if (updateError) throw updateError;

      // Create notification for the user who asked with correct link
      await supabase
        .from('notifications')
        .insert({
          user_id: question.user_id,
          title: "Sua pergunta foi respondida!",
          message: answerText.substring(0, 100) + (answerText.length > 100 ? '...' : ''),
          link: `/academy/modules/${question.module_id}/${question.lesson_id}`,
          type: "academy_answer"
        });

      toast({ title: "Resposta enviada!" });
      setAnsweringQuestion(null);
      setAnswerText("");
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEditAnswer = async (questionId: string, question: Question) => {
    if (!user || !editAnswerText.trim()) return;

    try {
      const { error: updateError } = await supabase
        .from('lesson_questions')
        .update({
          answer: editAnswerText.trim(),
          answered_by: user.id,
          answered_at: new Date().toISOString()
        })
        .eq('id', questionId);

      if (updateError) throw updateError;

      // Notificar usuário sobre atualização
      await supabase
        .from('notifications')
        .insert({
          user_id: question.user_id,
          title: "Resposta atualizada",
          message: "A resposta da sua pergunta foi atualizada",
          link: `/academy/modules/${question.module_id}/${question.lesson_id}`,
          type: "academy"
        });

      toast({ title: "Resposta atualizada com sucesso!" });
      setEditingQuestion(null);
      setEditAnswerText("");
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta pergunta? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lesson_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast({ 
        title: "Pergunta excluída",
        description: "A pergunta foi removida com sucesso"
      });
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const pendingCount = questions.filter(q => !q.answer).length;

  return (
    <div>
      <div className="space-y-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold">Central de Perguntas</h3>
          {pendingCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {pendingCount} {pendingCount === 1 ? 'pergunta pendente' : 'perguntas pendentes'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="flex-1 min-w-[80px] sm:flex-initial"
          >
            Todas
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
            className="flex-1 min-w-[80px] sm:flex-initial"
          >
            Pendentes
          </Button>
          <Button
            variant={filter === 'answered' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('answered')}
            className="flex-1 min-w-[80px] sm:flex-initial"
          >
            Respondidas
          </Button>
        </div>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : questions.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma pergunta encontrada</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <Card key={question.id} className="p-5">
              <div className="flex gap-3 mb-3">
                <Avatar>
                  <AvatarImage src={question.user.avatar_url || ""} />
                  <AvatarFallback>
                    {question.user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{question.user.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {question.lesson.module.title} → {question.lesson.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!question.answer && <Badge variant="destructive">Pendente</Badge>}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(question.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm mb-3">{question.question}</p>

                  {question.answer ? (
                    <div className="space-y-2">
                      {editingQuestion === question.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editAnswerText}
                            onChange={(e) => setEditAnswerText(e.target.value)}
                            placeholder="Edite sua resposta..."
                            rows={4}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEditAnswer(question.id, question)}
                              size="sm"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Salvar Alterações
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingQuestion(null);
                                setEditAnswerText("");
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="bg-accent rounded-lg p-3">
                            <Badge variant="secondary" className="mb-2">Resposta</Badge>
                            <p className="text-sm">{question.answer}</p>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingQuestion(question.id);
                                setEditAnswerText(question.answer || "");
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar Resposta
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteQuestion(question.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir Pergunta
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : answeringQuestion === question.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Digite sua resposta..."
                        rows={4}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAnswer(question.id, question)}
                          size="sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Resposta
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAnsweringQuestion(null);
                            setAnswerText("");
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAnsweringQuestion(question.id)}
                    >
                      Responder
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
