import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Question {
  id: string;
  question: string;
  answer: string | null;
  likes: number;
  created_at: string;
  answered_at: string | null;
  user: {
    full_name: string;
    avatar_url: string | null;
  };
  answeredBy: {
    full_name: string;
  } | null;
  userHasLiked: boolean;
}

interface QuestionsListProps {
  lessonId: string;
}

export function QuestionsList({ lessonId }: QuestionsListProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('lesson-questions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lesson_questions',
          filter: `lesson_id=eq.${lessonId}`
        },
        () => {
          fetchQuestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lessonId, user]);

  const fetchQuestions = async () => {
    try {
      const { data: questionsData, error } = await supabase
        .from('lesson_questions')
        .select(`
          *,
          user:profiles!user_id(full_name, avatar_url),
          answered_by_profile:profiles!answered_by(full_name)
        `)
        .eq('lesson_id', lessonId)
        .order('likes', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!questionsData) {
        setQuestions([]);
        return;
      }

      // Check if user has liked each question
      let userLikes: string[] = [];
      if (user) {
        const { data: likesData } = await supabase
          .from('question_likes')
          .select('question_id')
          .eq('user_id', user.id);

        userLikes = likesData?.map(l => l.question_id) || [];
      }

      const formattedQuestions = questionsData.map((q: any) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        likes: q.likes,
        created_at: q.created_at,
        answered_at: q.answered_at,
        user: q.user,
        answeredBy: q.answered_by_profile,
        userHasLiked: userLikes.includes(q.id)
      }));

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (questionId: string, hasLiked: boolean) => {
    if (!user) return;

    try {
      if (hasLiked) {
        // Unlike
        await supabase
          .from('question_likes')
          .delete()
          .eq('question_id', questionId)
          .eq('user_id', user.id);

        await supabase.rpc('decrement_question_likes', { question_id: questionId });
      } else {
        // Like
        await supabase
          .from('question_likes')
          .insert({ question_id: questionId, user_id: user.id });

        await supabase.rpc('increment_question_likes', { question_id: questionId });
      }

      fetchQuestions();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando perguntas...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Nenhuma pergunta ainda. Seja o primeiro a perguntar!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id} className="p-4">
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src={question.user.avatar_url || ""} />
              <AvatarFallback>
                {question.user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold">{question.user.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(question.created_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(question.id, question.userHasLiked)}
                  className="flex items-center gap-1"
                >
                  <Heart
                    className={`h-4 w-4 ${question.userHasLiked ? 'fill-red-500 text-red-500' : ''}`}
                  />
                  <span className="text-xs">{question.likes}</span>
                </Button>
              </div>
              
              <p className="text-sm mb-3">{question.question}</p>

              {question.answer && (
                <div className="bg-accent rounded-lg p-3 mt-3">
                  <Badge variant="secondary" className="mb-2">Resposta</Badge>
                  <p className="text-sm">{question.answer}</p>
                  {question.answeredBy && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Respondido por {question.answeredBy.full_name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
