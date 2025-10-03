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
  // Abordagem – Lead Novo (7 etapas, 1 mensagem cada)
  {
    id: "1",
    funnel: "lead-novo",
    stage: "1ª Abordagem",
    title: "Saudação Inicial",
    content: "👋 Oi [NOME]! Tudo bem? Vi que você demonstrou interesse em imóveis aqui em Itapema. Sou [CORRETOR], conselheiro da COMARC. Posso te ajudar a encontrar a opção que mais combina com o que você procura?",
    likes: 45,
    dislikes: 3,
  },
  {
    id: "2",
    funnel: "lead-novo",
    stage: "2ª Abordagem",
    title: "Confirmação de Recebimento",
    content: "👋 Oi [NOME], tudo bem? Só passando pra confirmar se você recebeu as informações sobre o [EMPREENDEDIMENTO]. Quer que eu te envie os detalhes ou as fotos?",
    likes: 38,
    dislikes: 5,
  },
  {
    id: "3",
    funnel: "lead-novo",
    stage: "3ª Abordagem",
    title: "Objetivo do Cliente",
    content: "👋 Oi [NOME], notei que você demonstrou interesse no [EMPREENDEDIMENTO]. Está buscando algo pra morar ou investir?",
    likes: 52,
    dislikes: 2,
  },
  {
    id: "4",
    funnel: "lead-novo",
    stage: "4ª Abordagem",
    title: "Resumo Rápido",
    content: "👋 [NOME], tudo bem? Vi que ainda não conseguimos falar. Quer que eu te mande um resumo rápido do [EMPREENDEDIMENTO]?",
    likes: 29,
    dislikes: 8,
  },
  {
    id: "5",
    funnel: "lead-novo",
    stage: "5ª Abordagem",
    title: "Condições Especiais",
    content: "👋 Oi [NOME], passando pra avisar que ainda temos boas condições no [EMPREENDEDIMENTO]. Posso te enviar um comparativo de valores?",
    likes: 41,
    dislikes: 4,
  },
  {
    id: "6",
    funnel: "lead-novo",
    stage: "6ª Abordagem",
    title: "Dia a Dia Corrido",
    content: "👋 [NOME], sei que o dia a dia é corrido. Só pra não perder a chance: ainda tem interesse no [EMPREENDEDIMENTO]?",
    likes: 33,
    dislikes: 6,
  },
  {
    id: "7",
    funnel: "lead-novo",
    stage: "7ª Abordagem",
    title: "Último Contato",
    content: "👋 Oi [NOME], última vez que entro em contato pra não te incomodar 🙂 Quer que eu te mostre as condições atuais do [EMPREENDEDIMENTO]?",
    likes: 27,
    dislikes: 9,
  },
  
  // Atendimento Geral (5 etapas)
  // Sondagem
  {
    id: "8",
    funnel: "atendimento",
    stage: "Sondagem",
    title: "Objetivo da Compra",
    content: "👋 Oi [NOME]! Vi que você pediu infos do [EMPREENDEDIMENTO]. Pra eu te ajudar melhor: você pensa em comprar pra morar ou pra investir?",
    likes: 67,
    dislikes: 1,
  },
  {
    id: "9",
    funnel: "atendimento",
    stage: "Sondagem",
    title: "Localização Atual",
    content: "Entendi 👍 E hoje você já mora na região ou está pensando em vir pra cá?",
    likes: 54,
    dislikes: 3,
  },
  {
    id: "10",
    funnel: "atendimento",
    stage: "Sondagem",
    title: "Prioridades",
    content: "Legal! O que mais é importante pra você nesse novo imóvel? (ex.: vista, lazer, nº de suítes, localização…)",
    likes: 61,
    dislikes: 2,
  },
  {
    id: "11",
    funnel: "atendimento",
    stage: "Sondagem",
    title: "Preferência de Região",
    content: "Tem alguma região ou bairro que você prefira?",
    likes: 48,
    dislikes: 4,
  },
  {
    id: "12",
    funnel: "atendimento",
    stage: "Sondagem",
    title: "Número de Quartos",
    content: "Quantos quartos você imagina que precisa pra ficar confortável?",
    likes: 52,
    dislikes: 2,
  },
  {
    id: "13",
    funnel: "atendimento",
    stage: "Sondagem",
    title: "Faixa de Valor",
    content: "Pra eu te mostrar as opções certas, tem uma faixa de valor que você está pensando?",
    likes: 44,
    dislikes: 8,
  },
  {
    id: "14",
    funnel: "atendimento",
    stage: "Sondagem",
    title: "Prazo",
    content: "Existe algum prazo ou data importante pra essa compra?",
    likes: 39,
    dislikes: 5,
  },
  {
    id: "15",
    funnel: "atendimento",
    stage: "Sondagem",
    title: "Transição para Envio",
    content: "Perfeito. Com base nisso, posso te enviar 2 opções alinhadas ao que você busca. Quer que eu te envie agora?",
    likes: 73,
    dislikes: 1,
  },
  
  // Apresentação do Produto
  {
    id: "16",
    funnel: "atendimento",
    stage: "Apresentação do Produto",
    title: "Primeiro Envio de Opções",
    content: "👋 [NOME], com base no que você me contou, separei duas opções que acredito que podem encaixar muito bem no que você busca.\nQuer que eu te envie as fotos e detalhes pra dar uma olhada?",
    likes: 68,
    dislikes: 2,
  },
  {
    id: "17",
    funnel: "atendimento",
    stage: "Apresentação do Produto",
    title: "Envio com Benefício Destacado",
    content: "👋 [NOME], encontrei uma opção que acho que vai te surpreender.\nO [EMPREENDEDIMENTO] tem [CARACTERÍSTICA CHAVE: ex. vista para o mar, lazer completo, ótima valorização] e está com condição especial no momento.\nQuer que eu te envie as plantas e os valores?",
    likes: 71,
    dislikes: 3,
  },
  {
    id: "18",
    funnel: "atendimento",
    stage: "Apresentação do Produto",
    title: "Envolvendo o Cliente na Escolha",
    content: "👋 [NOME], selecionei algumas opções de acordo com o que conversamos.\nQuer que eu te envie primeiro as que têm [DIFERENCIAL: ex. maior área de lazer, unidades com vista, pronto para morar] ou prefere ver as que têm o melhor custo-benefício?",
    likes: 59,
    dislikes: 4,
  },
  {
    id: "19",
    funnel: "atendimento",
    stage: "Apresentação do Produto",
    title: "Reforço de Escassez",
    content: "👋 [NOME], as últimas unidades do [EMPREENDEDIMENTO] estão com condição especial e acredito que valem a pena conhecer.\nQuer que eu te envie as informações antes que as melhores unidades sejam vendidas?",
    likes: 64,
    dislikes: 5,
  },
  
  // Visita / Call
  {
    id: "20",
    funnel: "atendimento",
    stage: "Visita / Call",
    title: "Agendar Reunião Online",
    content: "👋 [NOME], podemos agendar uma reunião online pra te apresentar melhor o [EMPREENDEDIMENTO] e tirar todas as dúvidas? Tenho disponibilidade [DIA/HORA].",
    likes: 76,
    dislikes: 2,
  },
  {
    id: "21",
    funnel: "atendimento",
    stage: "Visita / Call",
    title: "Call Rápida",
    content: "👋 [NOME], que tal fazermos uma call rápida pra te mostrar os detalhes do [EMPREENDEDIMENTO]? É bem prático e você consegue ver tudo sem sair de casa.",
    likes: 69,
    dislikes: 4,
  },
  
  // Proposta
  {
    id: "22",
    funnel: "atendimento",
    stage: "Proposta",
    title: "Abertura Consultiva",
    content: "👋 [NOME], com base na unidade que você mais gostou, já conseguimos calcular as condições ideais.\nQuer que eu te envie a proposta pra analisarmos juntos?",
    likes: 72,
    dislikes: 3,
  },
  {
    id: "23",
    funnel: "atendimento",
    stage: "Proposta",
    title: "Proposta com Urgência",
    content: "👋 [NOME], a condição especial que comentei está garantida até [DATA].\nQuer que eu te envie a proposta detalhada pra avaliarmos e garantir essa condição?",
    likes: 65,
    dislikes: 6,
  },
  {
    id: "24",
    funnel: "atendimento",
    stage: "Proposta",
    title: "Oportunidade de Investimento",
    content: "👋 [NOME], com a valorização prevista pra região e a condição que conseguimos, acredito que essa proposta do [EMPREENDEDIMENTO] está muito vantajosa.\nQuer dar uma olhada agora pra ver os números?",
    likes: 70,
    dislikes: 4,
  },
  {
    id: "25",
    funnel: "atendimento",
    stage: "Proposta",
    title: "Foco em Segurança",
    content: "👋 [NOME], já deixei a proposta pronta e podemos revisar juntos na call.\nAssim consigo te mostrar cada detalhe e esclarecer dúvidas na hora.\nQue dia/hora é melhor pra você?",
    likes: 68,
    dislikes: 5,
  },
  
  // Fechamento
  {
    id: "26",
    funnel: "atendimento",
    stage: "Fechamento",
    title: "Urgência Comercial",
    content: "👋 [NOME], só confirmando: conseguimos manter aquela condição especial até [DATA]. Quer aproveitar e garantir a unidade antes que o preço mude?",
    likes: 58,
    dislikes: 7,
  },
  {
    id: "27",
    funnel: "atendimento",
    stage: "Fechamento",
    title: "Exclusividade / Escassez",
    content: "👋 [NOME], as unidades do [EMPREENDEDIMENTO] com as melhores condições estão quase esgotando. Se quiser garantir a sua com essa condição, consigo reservar pra você até [DATA].",
    likes: 64,
    dislikes: 5,
  },
  {
    id: "28",
    funnel: "atendimento",
    stage: "Fechamento",
    title: "Oportunidade de Investimento",
    content: "👋 [NOME], essa condição do [EMPREENDEDIMENTO] é muito rara pra imóveis nessa região. Podemos fechar até [DATA] pra você não perder a valorização que vem por aí.",
    likes: 61,
    dislikes: 6,
  },
  
  // Repescagem
  {
    id: "29",
    funnel: "repescagem",
    stage: "Reativação",
    title: "Retomada de Contato",
    content: "👋 Oi [NOME], aqui é o [CORRETOR] da COMARC. Vi que você pediu informações sobre o [EMPREENDEDIMENTO] um tempo atrás. Chegou a encontrar algo que gostou ou ainda está avaliando opções?",
    likes: 34,
    dislikes: 9,
  },
  {
    id: "30",
    funnel: "repescagem",
    stage: "Reativação",
    title: "Novidade Relevante",
    content: "👋 [NOME], tudo bem? Só queria saber se você continua interessado em imóveis na região de [CIDADE]. Tem um detalhe novo no [EMPREENDEDIMENTO] que acho que pode te interessar. Quer que eu te conte?",
    likes: 41,
    dislikes: 6,
  },
  {
    id: "31",
    funnel: "repescagem",
    stage: "Reativação",
    title: "Condição Especial",
    content: "👋 Oi [NOME], aqui é o [CORRETOR]. Sei que você já recebeu contatos antes, mas queria te atualizar: temos uma condição especial no [EMPREENDEDIMENTO] válida por poucos dias. Posso te enviar agora?",
    likes: 38,
    dislikes: 7,
  },
  
  // Nutrição
  {
    id: "32",
    funnel: "nutricao",
    stage: "Educação",
    title: "Valorização da Região",
    content: "👋 Oi [NOME], compartilho essa novidade: [LINK]. É sobre a valorização da região de [CIDADE]/[BAIRRO]. Achei que poderia te interessar.",
    likes: 28,
    dislikes: 4,
  },
  {
    id: "33",
    funnel: "nutricao",
    stage: "Educação",
    title: "Dados de Mercado",
    content: "👋 [NOME], sabia que [CIDADE] teve valorização média de X% no último ano? Isso reforça as oportunidades de investimento. Se quiser, te mostro algumas opções.",
    likes: 36,
    dislikes: 3,
  },
  {
    id: "34",
    funnel: "nutricao",
    stage: "Oportunidades",
    title: "Novo Empreendimento",
    content: "👋 Oi [NOME], saiu um novo empreendimento em [BAIRRO], com perfil parecido ao que você buscou. Quer dar uma olhada rápida nas plantas?",
    likes: 42,
    dislikes: 5,
  },
];

const FUNNELS = [
  { id: "lead-novo", name: "🔴 Abordagem – Lead Novo" },
  { id: "atendimento", name: "🟢 Atendimento Geral" },
  { id: "repescagem", name: "🟠 Repescagem" },
  { id: "nutricao", name: "🔵 Nutrição" },
];

const STAGES = {
  "lead-novo": ["1ª Abordagem", "2ª Abordagem", "3ª Abordagem", "4ª Abordagem", "5ª Abordagem", "6ª Abordagem", "7ª Abordagem"],
  "atendimento": ["Sondagem", "Apresentação do Produto", "Visita / Call", "Proposta", "Fechamento"],
  "repescagem": ["Reativação"],
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
          <ScrollArea className="w-full">
            <TabsList className="mb-6 w-full justify-start inline-flex">
              {FUNNELS.map((funnel) => (
                <TabsTrigger key={funnel.id} value={funnel.id} className="whitespace-nowrap">
                  {funnel.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {FUNNELS.map((funnel) => (
            <TabsContent key={funnel.id} value={funnel.id}>
              {/* Kanban Board */}
              <ScrollArea className="w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
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
