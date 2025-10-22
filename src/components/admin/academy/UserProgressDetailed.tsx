import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Search, User, BookOpen, CheckCircle2, Circle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserProgress {
  userId: string;
  userName: string;
  team: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  moduleBreakdown: Array<{
    moduleId: string;
    moduleTitle: string;
    completedLessons: number;
    totalLessons: number;
    percentage: number;
    displayOrder: number;
    lessons: Array<{
      lessonId: string;
      lessonTitle: string;
      watched: boolean;
      watchedAt: string | null;
      displayOrder: number;
    }>;
  }>;
}

export function UserProgressDetailed() {
  const [loading, setLoading] = useState(true);
  const [usersProgress, setUsersProgress] = useState<UserProgress[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openUsers, setOpenUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUsersProgress();
  }, []);

  const fetchUsersProgress = async () => {
    try {
      setLoading(true);

      // Buscar módulos e aulas publicadas
      const { data: modules, error: modulesError } = await supabase
        .from("academy_modules")
        .select(`
          id,
          title,
          display_order,
          academy_lessons!inner(
            id,
            title,
            display_order
          )
        `)
        .eq("published", true)
        .eq("academy_lessons.published", true)
        .order("display_order");

      if (modulesError) throw modulesError;

      // Buscar usuários aprovados
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id, full_name, team")
        .eq("approved", true)
        .order("full_name");

      if (usersError) throw usersError;

      // Buscar todo o progresso
      const { data: allProgress, error: progressError } = await supabase
        .from("user_lesson_progress")
        .select("user_id, lesson_id, watched, watched_at");

      if (progressError) throw progressError;

      // Agregar dados
      const progress: UserProgress[] = users?.map(user => {
        const userProgress = allProgress?.filter(p => p.user_id === user.id) || [];
        
        const moduleBreakdown = modules?.map(module => {
          const moduleLessons = (module.academy_lessons as any[]) || [];
          const completedInModule = userProgress.filter(p => 
            moduleLessons.some(l => l.id === p.lesson_id && p.watched)
          );
          
          return {
            moduleId: module.id,
            moduleTitle: module.title,
            completedLessons: completedInModule.length,
            totalLessons: moduleLessons.length,
            percentage: moduleLessons.length > 0 
              ? Math.round((completedInModule.length / moduleLessons.length) * 100) 
              : 0,
            displayOrder: module.display_order,
            lessons: moduleLessons
              .map(lesson => {
                const lessonProgress = userProgress.find(p => p.lesson_id === lesson.id);
                return {
                  lessonId: lesson.id,
                  lessonTitle: lesson.title,
                  watched: lessonProgress?.watched || false,
                  watchedAt: lessonProgress?.watched_at || null,
                  displayOrder: lesson.display_order
                };
              })
              .sort((a, b) => a.displayOrder - b.displayOrder)
          };
        }).sort((a, b) => a.displayOrder - b.displayOrder) || [];
        
        const totalLessons = moduleBreakdown.reduce((sum, m) => sum + m.totalLessons, 0);
        const completedLessons = moduleBreakdown.reduce((sum, m) => sum + m.completedLessons, 0);
        
        return {
          userId: user.id,
          userName: user.full_name,
          team: user.team || "Sem time",
          totalLessons,
          completedLessons,
          progressPercentage: totalLessons > 0 
            ? Math.round((completedLessons / totalLessons) * 100) 
            : 0,
          moduleBreakdown
        };
      }) || [];

      // Ordenar por progresso (maior primeiro)
      progress.sort((a, b) => b.progressPercentage - a.progressPercentage);

      setUsersProgress(progress);
    } catch (error) {
      console.error("Erro ao buscar progresso:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setOpenUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const filteredUsers = usersProgress.filter(user =>
    user.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProgressVariant = (percentage: number): "great" | "good" | "okay" | "bad" => {
    if (percentage === 100) return "great";
    if (percentage >= 70) return "good";
    if (percentage >= 40) return "okay";
    return "bad";
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage === 100) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (percentage > 0) return <Circle className="h-4 w-4 text-yellow-600 fill-yellow-600" />;
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progresso Detalhado dos Usuários</CardTitle>
          <CardDescription>Acompanhe o progresso individual de cada corretor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Progresso Detalhado dos Usuários
        </CardTitle>
        <CardDescription>
          Acompanhe o progresso individual de cada corretor por módulo e aula
        </CardDescription>
        
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do corretor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
              </div>
            ) : (
              filteredUsers.map(user => {
                const isOpen = openUsers.has(user.userId);
                
                return (
                  <Collapsible
                    key={user.userId}
                    open={isOpen}
                    onOpenChange={() => toggleUser(user.userId)}
                  >
                    <Card className="border-2">
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 text-left">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-base truncate">
                                  {user.userName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {user.team}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="text-right">
                                <div className="font-bold text-lg">
                                  {user.completedLessons}/{user.totalLessons}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {user.progressPercentage}% completo
                                </div>
                              </div>
                              {isOpen ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <Progress 
                              value={user.progressPercentage} 
                              variant={getProgressVariant(user.progressPercentage)}
                              className="h-2"
                            />
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-3">
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                              Progresso por Módulo
                            </h4>
                            
                            <div className="space-y-4">
                              {user.moduleBreakdown.map(module => (
                                <div key={module.moduleId} className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      {getStatusIcon(module.percentage)}
                                      <span className="font-medium text-sm truncate">
                                        {module.moduleTitle}
                                      </span>
                                    </div>
                                    <Badge 
                                      variant={
                                        module.percentage === 100 ? "default" :
                                        module.percentage > 0 ? "secondary" : "outline"
                                      }
                                      className="flex-shrink-0"
                                    >
                                      {module.completedLessons}/{module.totalLessons}
                                    </Badge>
                                  </div>
                                  
                                  <Progress 
                                    value={module.percentage} 
                                    variant={getProgressVariant(module.percentage)}
                                    className="h-1.5"
                                  />
                                  
                                  {/* Lista de aulas do módulo */}
                                  <div className="ml-6 mt-2 space-y-1.5">
                                    {module.lessons.map(lesson => (
                                      <div 
                                        key={lesson.lessonId}
                                        className="flex items-center gap-2 text-xs"
                                      >
                                        {lesson.watched ? (
                                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                        ) : (
                                          <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        )}
                                        <span className={lesson.watched ? "text-foreground" : "text-muted-foreground"}>
                                          {lesson.lessonTitle}
                                        </span>
                                        {lesson.watched && lesson.watchedAt && (
                                          <span className="text-muted-foreground text-[10px] ml-auto">
                                            {new Date(lesson.watchedAt).toLocaleDateString('pt-BR')}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
