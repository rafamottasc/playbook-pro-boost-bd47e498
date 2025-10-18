import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { KanbanColumn } from "@/components/KanbanColumn";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFunnels } from "@/hooks/useFunnels";
import { useStages } from "@/hooks/useStages";
import { DynamicIcon } from "@/components/admin/DynamicIcon";

interface Message {
  id: string;
  title: string;
  content: string;
  likes: number;
  dislikes: number;
  stage_name: string;
  funnel_slug: string;
  delivery_type?: 'audio' | 'call' | 'text';
}

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userPoints, setUserPoints] = useState(127);
  const [activeFunnel, setActiveFunnel] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [userFeedbacks, setUserFeedbacks] = useState<Record<string, 'like' | 'dislike'>>({});
  const { toast } = useToast();
  const { funnels, loading: funnelsLoading } = useFunnels();
  const { stages } = useStages(activeFunnel);

  useEffect(() => {
    if (funnels.length > 0 && !activeFunnel) {
      setActiveFunnel(funnels[0].id);
    }
  }, [funnels, activeFunnel]);

  useEffect(() => {
    loadMessages();
    loadUserFeedbacks();
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("display_order");

      if (error) throw error;
      
      setMessages((data || []) as Message[]);
    } catch (error: any) {
      console.error("Erro ao carregar mensagens:", error);
      toast({
        title: "Erro ao carregar mensagens",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserFeedbacks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_message_feedback')
        .select('message_id, feedback_type')
        .eq('user_id', user.id);

      if (error) throw error;

      const feedbackMap: Record<string, 'like' | 'dislike'> = {};
      data?.forEach(fb => {
        feedbackMap[fb.message_id] = fb.feedback_type as 'like' | 'dislike';
      });
      setUserFeedbacks(feedbackMap);
    } catch (error: any) {
      console.error("Erro ao carregar feedbacks:", error);
    }
  };

  const handleMessageCopy = async (messageId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_message_copies')
        .insert({ user_id: user.id, message_id: messageId });
      
      if (!error) {
        toast({
          title: "✅ Mensagem copiada (+5 pts)",
          description: "Cole no WhatsApp e personalize com os dados do cliente. Continue interagindo para ganhar mais pontos!",
        });
      }
    } catch (error) {
      // Erro silencioso se já copiou esta mensagem hoje (duplicate key)
      console.log("Mensagem já copiada hoje");
    }
  };

  const handleMessageLike = async (messageId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado",
        variant: "destructive",
      });
      return;
    }

    if (userFeedbacks[messageId]) {
      toast({
        title: "Atenção",
        description: "Você já avaliou esta mensagem",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentMessage = messages.find(m => m.id === messageId);
      if (!currentMessage) return;

      const { error: updateError } = await supabase
        .from('messages')
        .update({ likes: currentMessage.likes + 1 })
        .eq('id', messageId);

      if (updateError) throw updateError;

      const { error: insertError } = await supabase
        .from('user_message_feedback')
        .insert({
          user_id: user.id,
          message_id: messageId,
          feedback_type: 'like'
        });

      if (insertError) throw insertError;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, likes: msg.likes + 1 } : msg
        )
      );
      setUserFeedbacks(prev => ({ ...prev, [messageId]: 'like' }));
      toast({
        title: "👍 Obrigado pelo feedback! (+5 pts)",
        description: "Sua avaliação ajuda a melhorar nossos playbooks.",
      });
    } catch (error: any) {
      console.error("Erro ao registrar like:", error);
      toast({
        title: "Erro ao registrar feedback",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMessageDislike = async (messageId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado",
        variant: "destructive",
      });
      return;
    }

    if (userFeedbacks[messageId]) {
      toast({
        title: "Atenção",
        description: "Você já avaliou esta mensagem",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentMessage = messages.find(m => m.id === messageId);
      if (!currentMessage) return;

      const { error: updateError } = await supabase
        .from('messages')
        .update({ dislikes: currentMessage.dislikes + 1 })
        .eq('id', messageId);

      if (updateError) throw updateError;

      const { error: insertError } = await supabase
        .from('user_message_feedback')
        .insert({
          user_id: user.id,
          message_id: messageId,
          feedback_type: 'dislike'
        });

      if (insertError) throw insertError;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, dislikes: msg.dislikes + 1 } : msg
        )
      );
      setUserFeedbacks(prev => ({ ...prev, [messageId]: 'dislike' }));
      toast({
        title: "Feedback registrado (+5 pts). Considere enviar uma sugestão! 👎",
      });
    } catch (error: any) {
      console.error("Erro ao registrar dislike:", error);
      toast({
        title: "Erro ao registrar feedback",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMessageSuggest = async (messageId: string, suggestion: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para enviar sugestões",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("suggestions")
        .insert([
          {
            message_id: messageId,
            user_id: user.id,
            suggestion_text: suggestion,
            status: "pending",
          },
        ]);

      if (error) {
        toast({
          title: "Erro ao enviar sugestão",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Sugestão enviada ao Master! (+5 pts)",
          description: "Sua sugestão será analisada e pode melhorar os playbooks para todos.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao enviar sugestão",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const currentStages = stages;

  // Convert active funnel UUID to slug for message filtering
  const activeFunnelSlug = funnels.find(f => f.id === activeFunnel)?.slug || "";

  if (loading || funnelsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 px-4 flex items-center justify-center">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando mensagens...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 px-4">
        {/* Funnels Tabs */}
        <Tabs value={activeFunnel} onValueChange={setActiveFunnel} className="w-full">
          <ScrollArea className="w-full">
            <TabsList className="mb-6 w-full justify-start inline-flex">
              {funnels.map((funnel) => (
                <TabsTrigger key={funnel.id} value={funnel.id} className="whitespace-nowrap gap-2">
                  <DynamicIcon name={funnel.emoji} className="h-4 w-4" />
                  {funnel.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {funnels.map((funnel) => (
            <TabsContent key={funnel.id} value={funnel.id}>
              {/* Kanban Board */}
              <ScrollArea className="w-full">
                <div className="grid gap-4 pb-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {currentStages.map((stage) => {
                    const stageMessages = messages.filter(
                      (msg) => msg.funnel_slug === activeFunnelSlug && msg.stage_name === stage.name
                    );
                    return (
                      <KanbanColumn
                        key={stage.id}
                        stage={stage.name}
                        messages={stageMessages}
                        userFeedbacks={userFeedbacks}
                        onMessageCopy={handleMessageCopy}
                        onMessageLike={handleMessageLike}
                        onMessageDislike={handleMessageDislike}
                        onMessageSuggest={handleMessageSuggest}
                      />
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
