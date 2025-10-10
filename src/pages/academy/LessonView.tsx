import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, FileText, ExternalLink } from "lucide-react";
import { VideoPlayer } from "@/components/academy/VideoPlayer";
import { LessonFeedback } from "@/components/academy/LessonFeedback";
import { QuestionForm } from "@/components/academy/QuestionForm";
import { QuestionsList } from "@/components/academy/QuestionsList";
import { LessonCompletionButton } from "@/components/academy/LessonCompletionButton";
import { ModuleCompletionCard } from "@/components/academy/ModuleCompletionCard";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageTransition } from "@/components/PageTransition";
import { toast } from "sonner";

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_url: string;
  points: number;
}

interface Attachment {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
}

interface NextModule {
  id: string;
  title: string;
}

export default function LessonView() {
  const { moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [nextLesson, setNextLesson] = useState<{ id: string; title: string } | null>(null);
  const [nextModule, setNextModule] = useState<NextModule | null>(null);
  const [currentModuleTitle, setCurrentModuleTitle] = useState("");
  const [moduleCompletedPoints, setModuleCompletedPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalLessons, setTotalLessons] = useState(0);
  const [currentLessonNumber, setCurrentLessonNumber] = useState(0);
  const [moduleProgress, setModuleProgress] = useState(0);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  useEffect(() => {
    if (lessonId) {
      fetchLessonData();
    }
  }, [lessonId]);

  const fetchLessonData = async () => {
    try {
      // Fetch lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('academy_lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;
      setLesson(lessonData);

      // Fetch attachments
      const { data: attachmentsData } = await supabase
        .from('lesson_attachments')
        .select('*')
        .eq('lesson_id', lessonId);

      setAttachments(attachmentsData || []);

      // Check if lesson is already completed
      if (user) {
        const { data: progressData } = await supabase
          .from('user_lesson_progress')
          .select('watched, video_progress')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .maybeSingle();

        setIsLessonCompleted(progressData?.watched || false);
        setVideoProgress(progressData?.video_progress || 0);
      }

      // Fetch all lessons for progress tracking
      if (lessonData) {
        const { data: allLessons } = await supabase
          .from('academy_lessons')
          .select('id, display_order, points')
          .eq('module_id', lessonData.module_id)
          .eq('published', true)
          .order('display_order', { ascending: true });

        if (allLessons) {
          setTotalLessons(allLessons.length);
          const currentIndex = allLessons.findIndex(l => l.id === lessonId);
          setCurrentLessonNumber(currentIndex + 1);
          
          // Calculate module progress
          if (user) {
            const lessonIds = allLessons.map(l => l.id);
            const { count } = await supabase
              .from('user_lesson_progress')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .in('lesson_id', lessonIds)
              .eq('watched', true);
            
            setModuleProgress((count || 0) / allLessons.length * 100);
          }
        }

        // Fetch next lesson
        const { data: nextLessonData } = await supabase
          .from('academy_lessons')
          .select('id, title')
          .eq('module_id', lessonData.module_id)
          .gt('display_order', lessonData.display_order || 0)
          .order('display_order', { ascending: true })
          .limit(1)
          .single();

        setNextLesson(nextLessonData);

        // If no next lesson, fetch next module
        if (!nextLessonData && allLessons) {
          // Get current module info
          const { data: currentModule } = await supabase
            .from('academy_modules')
            .select('display_order, title')
            .eq('id', lessonData.module_id)
            .single();

          if (currentModule) {
            setCurrentModuleTitle(currentModule.title);
            
            // Calculate total points earned in this module
            const totalModulePoints = allLessons.reduce((sum, lesson) => {
              return sum + (lesson.points || 0);
            }, 0);
            setModuleCompletedPoints(totalModulePoints);

            // Fetch next module
            const { data: nextModuleData } = await supabase
              .from('academy_modules')
              .select('id, title')
              .eq('published', true)
              .gt('display_order', currentModule.display_order)
              .order('display_order', { ascending: true })
              .limit(1)
              .single();

            setNextModule(nextModuleData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching lesson data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonComplete = async () => {
    if (!user || !lessonId || !lesson) return;

    try {
      // Mark lesson as watched
      const { error: progressError } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          watched: true,
          watched_at: new Date().toISOString(),
          completed_percentage: 100,
          video_progress: videoProgress
        });

      if (progressError) throw progressError;

      setIsLessonCompleted(true);
      
      toast.success(`🎉 Parabéns! Você ganhou +${lesson.points} pontos`, {
        description: "Aula marcada como concluída com sucesso!"
      });
      
      // Recalculate module progress with explicit refetch
      await fetchLessonData();

      // Points are automatically added by database trigger
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error("Erro ao marcar aula como concluída");
    }
  };

  const handleLessonUncomplete = async () => {
    if (!user || !lessonId || !lesson) return;

    try {
      // Unmark lesson and remove points
      const { error: progressError } = await supabase
        .from('user_lesson_progress')
        .update({
          watched: false,
          watched_at: null
        })
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId);

      if (progressError) throw progressError;

      // Remove points manually (direct update)
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        await supabase
          .from('profiles')
          .update({ points: Math.max(0, profile.points - lesson.points) })
          .eq('id', user.id);
      }

      setIsLessonCompleted(false);
      
      // Recalculate module progress
      await fetchLessonData();
      
      toast.success("Aula desmarcada", {
        description: `${lesson.points} pontos removidos`
      });
    } catch (error) {
      console.error('Error uncompleting lesson:', error);
      toast.error("Erro ao desmarcar aula");
    }
  };

  const handleVideoProgress = (percentage: number) => {
    if (!user || !lessonId) return;
    
    // Update local state
    setVideoProgress(percentage);
    
    // Save progress to database (debounced by only updating significant changes)
    if (percentage % 10 === 0 || percentage >= 95) {
      supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          video_progress: percentage,
          completed_percentage: percentage
        })
        .then(({ error }) => {
          if (error) console.error('Error saving video progress:', error);
        });
    }
  };

  const handleVideoComplete = async () => {
    // Auto-complete when video ends (if not already completed)
    if (!isLessonCompleted) {
      await handleLessonComplete();
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

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Aula não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageTransition>
        <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate(`/academy/modules/${moduleId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para aulas
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <VideoPlayer 
              videoUrl={lesson.video_url} 
              onComplete={handleVideoComplete}
              onProgress={handleVideoProgress}
            />

            {/* Lesson Info */}
            <div>
              {/* Progress Indicator */}
              {user && totalLessons > 0 && (
                <div className="mb-4 p-2 border border-border/40 rounded-lg bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      Aula {currentLessonNumber} de {totalLessons}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(moduleProgress)}% do módulo concluído
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={moduleProgress} className="h-1.5 flex-1" />
                    <LessonCompletionButton
                      isCompleted={isLessonCompleted}
                      onComplete={handleLessonComplete}
                      onUncomplete={handleLessonUncomplete}
                      videoProgress={videoProgress}
                      points={lesson.points}
                    />
                  </div>
                </div>
              )}

              <h1 className="text-lg sm:text-xl font-bold mb-3">{lesson.title}</h1>
              {lesson.description && (
                <p className="text-muted-foreground">{lesson.description}</p>
              )}
            </div>

            {/* Mobile Only: Materiais e Próxima Aula */}
            <div className="lg:hidden space-y-4">
              {attachments.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Materiais Complementares
                  </h3>
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
                      >
                        <span className="text-sm font-medium">{attachment.title}</span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </a>
                    ))}
                  </div>
                </Card>
              )}

              {/* Show Module Completion Card if last lesson and module 100% complete */}
              {!nextLesson && moduleProgress === 100 && (
                <ModuleCompletionCard
                  moduleTitle={currentModuleTitle}
                  totalPoints={moduleCompletedPoints}
                  nextModule={nextModule}
                  onViewModules={() => navigate('/academy/modules')}
                />
              )}

              {/* Show Next Lesson button if there's a next lesson */}
              {nextLesson && (
                <Button
                  onClick={() => navigate(`/academy/modules/${moduleId}/${nextLesson.id}`)}
                  className="w-full"
                >
                  Ir para próxima aula <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>

              {/* Feedback Section */}
              <LessonFeedback lessonId={lesson.id} />

            <Separator />

            {/* Questions Section */}
            <div>
              <h2 className="text-base sm:text-lg font-bold mb-4">Perguntas e Respostas</h2>
              <QuestionForm lessonId={lesson.id} />
              <QuestionsList lessonId={lesson.id} />
            </div>
          </div>

          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block space-y-6">
            {/* Attachments */}
            {attachments.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Materiais Complementares
                </h3>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
                    >
                      <span className="text-sm font-medium">{attachment.title}</span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </a>
                  ))}
                </div>
              </Card>
            )}

            {/* Show Module Completion Card if last lesson and module 100% complete */}
            {!nextLesson && moduleProgress === 100 && (
              <ModuleCompletionCard
                moduleTitle={currentModuleTitle}
                totalPoints={moduleCompletedPoints}
                nextModule={nextModule}
                onViewModules={() => navigate('/academy/modules')}
              />
            )}

            {/* Show Next Lesson button if there's a next lesson */}
            {nextLesson && (
              <Button
                onClick={() => navigate(`/academy/modules/${moduleId}/${nextLesson.id}`)}
                className="w-full"
              >
                Ir para próxima aula <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
      </PageTransition>
    </div>
  );
}
