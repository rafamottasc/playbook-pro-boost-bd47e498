import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LessonCard } from "@/components/academy/LessonCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PageTransition } from "@/components/PageTransition";

interface Module {
  id: string;
  title: string;
  description: string | null;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration_minutes: number | null;
  points: number;
  display_order: number;
}

export default function ModuleLessons() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (moduleId) {
      fetchModuleAndLessons();
    }
  }, [moduleId]);

  const fetchModuleAndLessons = async () => {
    try {
      // Fetch module
      const { data: moduleData, error: moduleError } = await supabase
        .from('academy_modules')
        .select('*')
        .eq('id', moduleId)
        .maybeSingle();

      if (moduleError) throw moduleError;
      setModule(moduleData);

      // Fetch lessons for the module (only published)
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('academy_lessons')
        .select('*')
        .eq('module_id', moduleId)
        .eq('published', true)
        .order('display_order', { ascending: true });

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      // Fetch completed lessons count
      if (user && lessonsData) {
        const lessonIds = lessonsData.map(l => l.id);
        const { count } = await supabase
          .from('user_lesson_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds)
          .eq('watched', true);

        setCompletedCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching module and lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Módulo não encontrado</p>
        </div>
      </div>
    );
  }

  const progress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageTransition>
        <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/resources/training')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para módulos
        </Button>

        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{module.title}</h1>
              {module.description && (
                <p className="text-muted-foreground text-lg">{module.description}</p>
              )}
            </div>
          </div>

          {user && lessons.length > 0 && (
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso do Módulo</span>
                <span className="text-sm text-muted-foreground">
                  {completedCount} de {lessons.length} aulas concluídas
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-20">
            <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma aula disponível</h3>
            <p className="text-muted-foreground">
              As aulas deste módulo estarão disponíveis em breve.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {lessons.map((lesson, index) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                moduleId={moduleId!}
                lessonNumber={index + 1}
              />
            ))}
          </div>
        )}
      </main>
      </PageTransition>
    </div>
  );
}
