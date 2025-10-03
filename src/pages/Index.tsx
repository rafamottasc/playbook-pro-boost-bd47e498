import { useState } from "react";
import { Header } from "@/components/Header";
import { KanbanColumn } from "@/components/KanbanColumn";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  title: string;
  content: string;
  likes: number;
  dislikes: number;
  stage: string;
  funnel: string;
}

const INITIAL_MESSAGES: Message[] = [
  // Abordagem – Lead Novo
  {
    id: "1",
    funnel: "lead-novo",
    stage: "Primeiro Contato",
    title: "Saudação Inicial",
    content: "👋 Oi [NOME]! Tudo bem? Vi que você demonstrou interesse em imóveis aqui em Itapema. Sou [CORRETOR], conselheiro da COMARC. Posso te ajudar a encontrar a opção que mais combina com o que você procura?",
    likes: 45,
    dislikes: 3,
  },
  {
    id: "2",
    funnel: "lead-novo",
    stage: "Primeiro Contato",
    title: "Confirmação de Recebimento",
    content: "👋 Oi [NOME], tudo bem? Só passando pra confirmar se você recebeu as informações sobre o [EMPREENDEDIMENTO]. Quer que eu te envie os detalhes ou as fotos?",
    likes: 38,
    dislikes: 5,
  },
  {
    id: "3",
    funnel: "lead-novo",
    stage: "Qualificação",
    title: "Objetivo do Cliente",
    content: "👋 Oi [NOME], notei que você demonstrou interesse no [EMPREENDEDIMENTO]. Está buscando algo pra morar ou investir?",
    likes: 52,
    dislikes: 2,
  },
  {
    id: "4",
    funnel: "lead-novo",
    stage: "Follow-up",
    title: "Resumo Rápido",
    content: "👋 [NOME], tudo bem? Vi que ainda não conseguimos falar. Quer que eu te mande um resumo rápido do [EMPREENDEDIMENTO]?",
    likes: 29,
    dislikes: 8,
  },
  {
    id: "5",
    funnel: "lead-novo",
    stage: "Follow-up",
    title: "Condições Especiais",
    content: "👋 Oi [NOME], passando pra avisar que ainda temos boas condições no [EMPREENDEDIMENTO]. Posso te enviar um comparativo de valores?",
    likes: 41,
    dislikes: 4,
  },
  // Atendimento Geral
  {
    id: "6",
    funnel: "atendimento",
    stage: "Sondagem",
    title: "Objetivo da Compra",
    content: "👋 Oi [NOME]! Vi que você pediu infos do [EMPREENDEDIMENTO]. Pra eu te ajudar melhor: você pensa em comprar pra morar ou pra investir?",
    likes: 67,
    dislikes: 1,
  },
  {
    id: "7",
    funnel: "atendimento",
    stage: "Sondagem",
    title: "Localização Atual",
    content: "Entendi 👍 E hoje você já mora na região ou está pensando em vir pra cá?",
    likes: 54,
    dislikes: 3,
  },
  {
    id: "8",
    funnel: "atendimento",
    stage: "Sondagem",
    title: "Prioridades",
    content: "Legal! O que mais é importante pra você nesse novo imóvel? (ex.: vista, lazer, nº de suítes, localização…)",
    likes: 61,
    dislikes: 2,
  },
  {
    id: "9",
    funnel: "atendimento",
    stage: "Apresentação",
    title: "Envio de Opções",
    content: "Perfeito. Com base nisso, posso te enviar 2 opções alinhadas ao que você busca. Quer que eu te envie agora?",
    likes: 73,
    dislikes: 1,
  },
  {
    id: "10",
    funnel: "atendimento",
    stage: "Fechamento",
    title: "Urgência Comercial",
    content: "👋 [NOME], só confirmando: conseguimos manter aquela condição especial até [DATA]. Quer aproveitar e garantir a unidade antes que o preço mude?",
    likes: 58,
    dislikes: 7,
  },
  {
    id: "11",
    funnel: "atendimento",
    stage: "Fechamento",
    title: "Exclusividade",
    content: "👋 [NOME], as unidades do [EMPREENDEDIMENTO] com as melhores condições estão quase esgotando. Se quiser garantir a sua com essa condição, consigo reservar pra você até [DATA].",
    likes: 64,
    dislikes: 5,
  },
  // Repescagem
  {
    id: "12",
    funnel: "repescagem",
    stage: "Reativação",
    title: "Retomada de Contato",
    content: "👋 Oi [NOME], aqui é o [CORRETOR] da COMARC. Vi que você pediu informações sobre o [EMPREENDEDIMENTO] um tempo atrás. Chegou a encontrar algo que gostou ou ainda está avaliando opções?",
    likes: 34,
    dislikes: 9,
  },
  {
    id: "13",
    funnel: "repescagem",
    stage: "Reativação",
    title: "Novidade Relevante",
    content: "👋 [NOME], tudo bem? Só queria saber se você continua interessado em imóveis na região de [CIDADE]. Tem um detalhe novo no [EMPREENDEDIMENTO] que acho que pode te interessar. Quer que eu te conte?",
    likes: 41,
    dislikes: 6,
  },
  // Nutrição
  {
    id: "14",
    funnel: "nutricao",
    stage: "Educação",
    title: "Valorização da Região",
    content: "👋 Oi [NOME], compartilho essa novidade: [LINK]. É sobre a valorização da região de [CIDADE]/[BAIRRO]. Achei que poderia te interessar.",
    likes: 28,
    dislikes: 4,
  },
  {
    id: "15",
    funnel: "nutricao",
    stage: "Educação",
    title: "Dados de Mercado",
    content: "👋 [NOME], sabia que [CIDADE] teve valorização média de X% no último ano? Isso reforça as oportunidades de investimento. Se quiser, te mostro algumas opções.",
    likes: 36,
    dislikes: 3,
  },
];

const FUNNELS = [
  { id: "lead-novo", name: "🔴 Abordagem – Lead Novo" },
  { id: "atendimento", name: "🟢 Atendimento Geral" },
  { id: "repescagem", name: "🟠 Repescagem" },
  { id: "nutricao", name: "🔵 Nutrição" },
];

const STAGES = {
  "lead-novo": ["Primeiro Contato", "Qualificação", "Follow-up"],
  "atendimento": ["Sondagem", "Apresentação", "Fechamento"],
  "repescagem": ["Reativação", "Atualização"],
  "nutricao": ["Educação", "Oportunidades"],
};

export default function Index() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [userPoints, setUserPoints] = useState(127);
  const [activeFunnel, setActiveFunnel] = useState("lead-novo");

  const handleMessageCopy = (messageId: string) => {
    setUserPoints((prev) => prev + 1);
  };

  const handleMessageLike = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, likes: msg.likes + 1 } : msg
      )
    );
    setUserPoints((prev) => prev + 0.5);
  };

  const handleMessageDislike = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, dislikes: msg.dislikes + 1 } : msg
      )
    );
  };

  const handleMessageSuggest = (messageId: string, suggestion: string) => {
    console.log("Sugestão recebida:", { messageId, suggestion });
  };

  const currentStages = STAGES[activeFunnel as keyof typeof STAGES];

  return (
    <div className="min-h-screen bg-background">
      <Header userPoints={userPoints} userName="João Silva" />

      <main className="container py-6 px-4">
        {/* Funnels Tabs */}
        <Tabs value={activeFunnel} onValueChange={setActiveFunnel} className="w-full">
          <TabsList className="mb-6 w-full justify-start">
            {FUNNELS.map((funnel) => (
              <TabsTrigger key={funnel.id} value={funnel.id}>
                {funnel.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {FUNNELS.map((funnel) => (
            <TabsContent key={funnel.id} value={funnel.id}>
              {/* Kanban Board */}
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4">
                  {currentStages.map((stage) => {
                    const stageMessages = messages.filter(
                      (msg) => msg.funnel === activeFunnel && msg.stage === stage
                    );
                    return (
                      <KanbanColumn
                        key={stage}
                        stage={stage}
                        messages={stageMessages}
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
