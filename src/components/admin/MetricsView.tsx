import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ThumbsUp, ThumbsDown, Copy, TrendingUp } from "lucide-react";

interface MessageDetail {
  title: string;
  content: string;
  funnel: string;
  stage: string;
  likes: number;
  dislikes: number;
}

interface Metrics {
  totalMessages: number;
  totalLikes: number;
  totalDislikes: number;
  totalCopies: number;
  topLikedMessages: MessageDetail[];
  topDislikedMessages: MessageDetail[];
}

export function MetricsView() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalMessages: 0,
    totalLikes: 0,
    totalDislikes: 0,
    totalCopies: 0,
    topLikedMessages: [],
    topDislikedMessages: [],
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();

    // Configurar subscription em tempo real para a tabela messages
    const channel = supabase
      .channel('messages-metrics-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE e DELETE
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Recarrega as métricas quando houver mudanças na tabela messages
          loadMetrics();
        }
      )
      .subscribe();

    // Cleanup da subscription quando o componente desmontar
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMetrics = async () => {
    try {
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*");

      if (error) throw error;

      const totalLikes = messages?.reduce((sum, msg) => sum + (msg.likes || 0), 0) || 0;
      const totalDislikes = messages?.reduce((sum, msg) => sum + (msg.dislikes || 0), 0) || 0;

      // Top 3 mensagens mais curtidas
      const topLiked = messages
        ?.filter(msg => (msg.likes || 0) > 0)
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 3)
        .map(msg => ({
          title: msg.title,
          content: msg.content,
          funnel: msg.funnel,
          stage: msg.stage,
          likes: msg.likes || 0,
          dislikes: msg.dislikes || 0
        })) || [];

      // Top 3 mensagens mais descurtidas
      const topDisliked = messages
        ?.filter(msg => (msg.dislikes || 0) > 0)
        .sort((a, b) => (b.dislikes || 0) - (a.dislikes || 0))
        .slice(0, 3)
        .map(msg => ({
          title: msg.title,
          content: msg.content,
          funnel: msg.funnel,
          stage: msg.stage,
          likes: msg.likes || 0,
          dislikes: msg.dislikes || 0
        })) || [];

      setMetrics({
        totalMessages: messages?.length || 0,
        totalLikes,
        totalDislikes,
        totalCopies: 0,
        topLikedMessages: topLiked,
        topDislikedMessages: topDisliked,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar métricas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando métricas...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Métricas de Uso do Sistema</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-background dark:from-blue-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Mensagens
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              Mensagens no playbook
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-background dark:from-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Likes</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{metrics.totalLikes}</div>
            <p className="text-xs text-muted-foreground">
              Aprovações dos corretores
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-background dark:from-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Dislikes
            </CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics.totalDislikes}</div>
            <p className="text-xs text-muted-foreground">
              Mensagens a melhorar
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-background dark:from-purple-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Aprovação
            </CardTitle>
            <Copy className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {metrics.totalLikes + metrics.totalDislikes > 0
                ? Math.round(
                    (metrics.totalLikes /
                      (metrics.totalLikes + metrics.totalDislikes)) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Likes vs total de avaliações
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top 3 Mais Curtidas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ThumbsUp className="h-5 w-5 text-green-500" />
            Top 3 Mensagens Mais Curtidas
          </h3>
          {metrics.topLikedMessages.length > 0 ? (
            metrics.topLikedMessages.map((message, index) => (
              <Card 
                key={index} 
                className="border-2 border-green-200 dark:border-green-900 bg-gradient-to-br from-green-50 to-background dark:from-green-950/20"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {index + 1}º Lugar
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold">{message.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {message.funnel} - {message.stage}
                    </p>
                  </div>
                  <p className="text-sm bg-muted/50 p-2 rounded-md whitespace-pre-wrap line-clamp-3">
                    {message.content}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                      <ThumbsUp className="h-4 w-4" />
                      {message.likes}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <ThumbsDown className="h-4 w-4" />
                      {message.dislikes}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma mensagem curtida ainda
              </CardContent>
            </Card>
          )}
        </div>

        {/* Top 3 Mais Descurtidas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ThumbsDown className="h-5 w-5 text-red-500" />
            Top 3 Mensagens Mais Descurtidas
          </h3>
          {metrics.topDislikedMessages.length > 0 ? (
            metrics.topDislikedMessages.map((message, index) => (
              <Card 
                key={index} 
                className="border-2 border-red-200 dark:border-red-900 bg-gradient-to-br from-red-50 to-background dark:from-red-950/20"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="text-2xl">
                      {index === 0 ? '⚠️' : index === 1 ? '🔔' : '📌'}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {index + 1}º Lugar
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold">{message.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {message.funnel} - {message.stage}
                    </p>
                  </div>
                  <p className="text-sm bg-muted/50 p-2 rounded-md whitespace-pre-wrap line-clamp-3">
                    {message.content}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <ThumbsUp className="h-4 w-4" />
                      {message.likes}
                    </span>
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                      <ThumbsDown className="h-4 w-4" />
                      {message.dislikes}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma mensagem descurtida ainda
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
