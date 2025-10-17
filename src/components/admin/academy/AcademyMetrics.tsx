import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Eye, CheckCircle2, Users, MessageCircle, ThumbsUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Metrics {
  totalViews: number;
  totalCompletions: number;
  completionRate: number;
  totalQuestions: number;
  pendingQuestions: number;
  positiveRating: number;
  totalRatings: number;
  topUsers: Array<{ full_name: string; completions: number }>;
  topModule: { title: string; views: number } | null;
}

export function AcademyMetrics() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalViews: 0,
    totalCompletions: 0,
    completionRate: 0,
    totalQuestions: 0,
    pendingQuestions: 0,
    positiveRating: 0,
    totalRatings: 0,
    topUsers: [],
    topModule: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Executar todas as queries independentes em paralelo
      const [
        { count: totalViews },
        { count: totalCompletions },
        { count: totalQuestions },
        { count: pendingQuestions },
        { data: feedbackData },
        { data: topUsersData },
        { data: moduleViewsData }
      ] = await Promise.all([
        supabase.from('user_lesson_progress').select('*', { count: 'exact', head: true }),
        supabase.from('user_lesson_progress').select('*', { count: 'exact', head: true }).eq('watched', true),
        supabase.from('lesson_questions').select('*', { count: 'exact', head: true }),
        supabase.from('lesson_questions').select('*', { count: 'exact', head: true }).is('answer', null),
        supabase.from('lesson_feedback').select('was_useful'),
        supabase.from('user_lesson_progress').select('user_id, profiles!inner(full_name)').eq('watched', true),
        supabase.from('user_lesson_progress').select('lesson_id, academy_lessons!inner(module_id, academy_modules!inner(title))')
      ]);

      const completionRate = totalViews ? (totalCompletions! / totalViews) * 100 : 0;

      // Avaliações
      const totalRatings = feedbackData?.length || 0;
      const positiveCount = feedbackData?.filter(f => f.was_useful).length || 0;
      const positiveRating = totalRatings ? (positiveCount / totalRatings) * 100 : 0;

      // Agregar conclusões por usuário
      const userCompletions: { [key: string]: { name: string; count: number } } = {};
      topUsersData?.forEach((record: any) => {
        const userId = record.user_id;
        const userName = record.profiles.full_name;
        if (!userCompletions[userId]) {
          userCompletions[userId] = { name: userName, count: 0 };
        }
        userCompletions[userId].count++;
      });

      const topUsers = Object.values(userCompletions)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(u => ({ full_name: u.name, completions: u.count }));

      // Agregar visualizações por módulo (1 query ao invés de N)
      const moduleViews: { [key: string]: { title: string; count: number } } = {};
      moduleViewsData?.forEach((progress: any) => {
        const moduleId = progress.academy_lessons.module_id;
        const moduleTitle = progress.academy_lessons.academy_modules.title;
        
        if (!moduleViews[moduleId]) {
          moduleViews[moduleId] = { title: moduleTitle, count: 0 };
        }
        moduleViews[moduleId].count++;
      });

      const topModuleEntry = Object.values(moduleViews).sort((a, b) => b.count - a.count)[0];
      const topModule = topModuleEntry ? { title: topModuleEntry.title, views: topModuleEntry.count } : null;

      setMetrics({
        totalViews: totalViews || 0,
        totalCompletions: totalCompletions || 0,
        completionRate: Math.round(completionRate),
        totalQuestions: totalQuestions || 0,
        pendingQuestions: pendingQuestions || 0,
        positiveRating: Math.round(positiveRating),
        totalRatings,
        topUsers,
        topModule
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h3 className="text-xl font-semibold mb-6">Métricas da Academy</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Métricas da Academy</h3>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aulas Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCompletions}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.completionRate}% de taxa de conclusão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Perguntas Pendentes</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingQuestions}</div>
            <p className="text-xs text-muted-foreground">
              de {metrics.totalQuestions} no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avaliações Positivas</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.positiveRating}%</div>
            <p className="text-xs text-muted-foreground">
              de {metrics.totalRatings} avaliações
            </p>
          </CardContent>
        </Card>

        {metrics.topModule && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Módulo Mais Popular</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.topModule.title}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.topModule.views} visualizações
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              das aulas visualizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {metrics.topUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Corretores Mais Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{user.full_name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {user.completions} {user.completions === 1 ? 'aula' : 'aulas'} concluídas
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
