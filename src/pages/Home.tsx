import React from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, GraduationCap, FolderOpen, Building2, TrendingUp, Calculator, Hand } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { PageTransition } from "@/components/PageTransition";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { DailyMoodCard } from "@/components/DailyMoodCard";
import { PollPopup } from "@/components/PollPopup";
import { UpcomingMeetingsSidebar } from "@/components/agenda/UpcomingMeetingsSidebar";
import { TasksPreviewCard } from "@/components/tasks/TasksPreviewCard";

interface NavCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
}

export default function Home() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  // Função para gerar saudação baseada no horário
  const getGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Bom dia: 5:00 até 12:30
    if (hour >= 5 && (hour < 12 || (hour === 12 && minute <= 30))) {
      return "Bom dia";
    } 
    // Boa tarde: 12:31 até 18:30
    else if ((hour === 12 && minute > 30) || (hour > 12 && hour < 18) || (hour === 18 && minute <= 30)) {
      return "Boa tarde";
    } 
    // Boa noite: 18:31 até 4:59
    else {
      return "Boa noite";
    }
  };

  const greeting = getGreeting();
  const firstName = profile?.full_name?.split(" ")[0] || "Usuário";

  const navigationCards: NavCard[] = [
    {
      title: "Calculadora de Fluxo",
      description: "Simule e gere propostas",
      icon: <Calculator className="w-12 h-12" />,
      route: "/calculator",
    },
    {
      title: "Playbooks de Atendimento",
      description: "Mensagens e abordagens prontas",
      icon: <MessageSquare className="w-12 h-12" />,
      route: "/playbooks",
    },
    {
      title: "Treinamentos Gerais",
      description: "Conteúdos completos de capacitação",
      icon: <GraduationCap className="w-12 h-12" />,
      route: "/academy/modules",
    },
    {
      title: "Central de Recursos",
      description: "Guias, PDFs e documentos úteis",
      icon: <FolderOpen className="w-12 h-12" />,
      route: "/resources",
    },
    {
      title: "Construtoras Parceiras",
      description: "Informações essenciais das construtoras",
      icon: <Building2 className="w-12 h-12" />,
      route: "/campaigns/partners",
    },
    {
      title: "Campanhas Ativas",
      description: "Acompanhe campanhas de anúncio",
      icon: <TrendingUp className="w-12 h-12" />,
      route: "/campaigns",
    },
  ];

  

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageTransition>
        <main className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-foreground flex items-center justify-center gap-2">
              {greeting}, {firstName}!
              <Hand className="h-8 w-8 text-primary" />
            </h1>
          </div>

          {/* Announcement Banner */}
          <AnnouncementBanner />

          {/* Daily Mood Card */}
          <DailyMoodCard />

          {/* Main Layout: 2 Columns + Sidebar */}
          <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
            {/* Colunas 1 e 2 - Cards de navegação em grid 2 colunas */}
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {navigationCards.map((card, index) => (
                  <Card
                    key={card.route}
                    className="cursor-pointer animate-fade-in transition-all duration-300 border border-border/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:translate-y-[-2px]"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => navigate(card.route)}
                  >
                    <CardHeader className="text-center pb-4">
                      <div className="flex justify-center mb-4 text-primary">
                        {card.icon}
                      </div>
                      <CardTitle className="text-xl">{card.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <CardDescription className="text-base">
                        {card.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Coluna 3 - Sidebar de Tarefas e Reuniões */}
            <div className="w-full lg:w-[380px] space-y-6">
              <TasksPreviewCard />
              <UpcomingMeetingsSidebar />
            </div>
          </div>

          {/* Poll Popup */}
          <PollPopup />
        </main>
      </PageTransition>
    </div>
  );
}
