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
  mostLikedMessage?: MessageDetail;
  mostDislikedMessage?: MessageDetail;
}

export function MetricsView() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalMessages: 0,
    totalLikes: 0,
    totalDislikes: 0,
    totalCopies: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*");

      if (error) throw error;

      const totalLikes = messages?.reduce((sum, msg) => sum + (msg.likes || 0), 0) || 0;
      const totalDislikes = messages?.reduce((sum, msg) => sum + (msg.dislikes || 0), 0) || 0;

      const mostLiked = messages?.reduce((max, msg) => 
        (msg.likes || 0) > (max.likes || 0) ? msg : max
      , messages[0]);

      const mostDisliked = messages?.reduce((max, msg) => 
        (msg.dislikes || 0) > (max.dislikes || 0) ? msg : max
      , messages[0]);

      setMetrics({
        totalMessages: messages?.length || 0,
        totalLikes,
        totalDislikes,
        totalCopies: 0,
        mostLikedMessage: mostLiked ? {
          title: mostLiked.title,
          content: mostLiked.content,
          funnel: mostLiked.funnel,
          stage: mostLiked.stage,
          likes: mostLiked.likes || 0,
          dislikes: mostLiked.dislikes || 0
        } : undefined,
        mostDislikedMessage: (mostDisliked && mostDisliked.dislikes > 0) ? {
          title: mostDisliked.title,
          content: mostDisliked.content,
          funnel: mostDisliked.funnel,
          stage: mostDisliked.stage,
          likes: mostDisliked.likes || 0,
          dislikes: mostDisliked.dislikes || 0
        } : undefined,
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

      <div className="grid gap-4 md:grid-cols-2">
        {metrics.mostLikedMessage && (
          <Card className="border-2 border-green-200 dark:border-green-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-green-500" />
                Mensagem Mais Curtida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-lg">{metrics.mostLikedMessage.title}</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.mostLikedMessage.funnel} - {metrics.mostLikedMessage.stage}
                </p>
              </div>
              <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                {metrics.mostLikedMessage.content}
              </p>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <ThumbsUp className="h-4 w-4" />
                  {metrics.mostLikedMessage.likes} likes
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <ThumbsDown className="h-4 w-4" />
                  {metrics.mostLikedMessage.dislikes} dislikes
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {metrics.mostDislikedMessage && (
          <Card className="border-2 border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThumbsDown className="h-5 w-5 text-red-500" />
                Mensagem Mais Descurtida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-lg">{metrics.mostDislikedMessage.title}</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.mostDislikedMessage.funnel} - {metrics.mostDislikedMessage.stage}
                </p>
              </div>
              <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                {metrics.mostDislikedMessage.content}
              </p>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <ThumbsUp className="h-4 w-4" />
                  {metrics.mostDislikedMessage.likes} likes
                </span>
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <ThumbsDown className="h-4 w-4" />
                  {metrics.mostDislikedMessage.dislikes} dislikes
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
