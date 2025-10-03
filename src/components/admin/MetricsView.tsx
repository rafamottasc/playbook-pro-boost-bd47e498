import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ThumbsUp, ThumbsDown, Copy, TrendingUp } from "lucide-react";

interface Metrics {
  totalMessages: number;
  totalLikes: number;
  totalDislikes: number;
  totalCopies: number;
  mostLikedMessage?: {
    title: string;
    likes: number;
  };
  mostCopiedMessage?: {
    title: string;
    copies: number;
  };
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

      setMetrics({
        totalMessages: messages?.length || 0,
        totalLikes,
        totalDislikes,
        totalCopies: 0, // Pode ser implementado com tracking adicional
        mostLikedMessage: mostLiked ? {
          title: mostLiked.title,
          likes: mostLiked.likes || 0
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Mensagens
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              Mensagens no playbook
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Likes</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLikes}</div>
            <p className="text-xs text-muted-foreground">
              Aprovações dos corretores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Dislikes
            </CardTitle>
            <ThumbsDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDislikes}</div>
            <p className="text-xs text-muted-foreground">
              Mensagens a melhorar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Aprovação
            </CardTitle>
            <Copy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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

      {metrics.mostLikedMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Mensagem Mais Curtida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ThumbsUp className="h-8 w-8 text-comarc-green" />
              <div>
                <p className="font-semibold">{metrics.mostLikedMessage.title}</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.mostLikedMessage.likes} likes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
