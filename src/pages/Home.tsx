import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, GraduationCap, FolderOpen, Building2, TrendingUp, Settings, Calculator, Hand, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { PageTransition } from "@/components/PageTransition";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { DailyMoodCard } from "@/components/DailyMoodCard";
import { FeedbackCard } from "@/components/FeedbackCard";
import { FeedbackModal } from "@/components/FeedbackModal";
import { PollPopup } from "@/components/PollPopup";
import { WeeklyPreview } from "@/components/agenda/WeeklyPreview";

interface NavCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  adminOnly?: boolean;
}

export default function Home() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { profile } = useProfile();
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

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
      title: "Playbooks de Atendimento",
      description: "Acesse mensagens prontas e abordagens estratégicas para suas conversas",
      icon: <MessageSquare className="w-12 h-12" />,
      route: "/playbooks",
    },
    {
      title: "Treinamentos Gerais",
      description: "Treinamentos completos e materiais de capacitação profissional",
      icon: <GraduationCap className="w-12 h-12" />,
      route: "/academy/modules",
    },
    {
      title: "Central de Recursos",
      description: "Materiais de apoio, guias, PDFs e documentos úteis",
      icon: <FolderOpen className="w-12 h-12" />,
      route: "/resources",
    },
    {
      title: "Construtoras Parceiras",
      description: "Informações e materiais das construtoras parceiras",
      icon: <Building2 className="w-12 h-12" />,
      route: "/campaigns/partners",
    },
    {
      title: "Agenda de Reuniões",
      description: "Agende reuniões e reserve salas de forma prática",
      icon: <Calendar className="w-12 h-12" />,
      route: "/agenda",
    },
    {
      title: "Calculadora de Fluxo",
      description: "Simule condições de pagamento e gere propostas profissionais",
      icon: <Calculator className="w-12 h-12" />,
      route: "/calculator",
    },
    {
      title: "Campanhas Ativas",
      description: "Acompanhe campanhas e resultados de construtoras",
      icon: <TrendingUp className="w-12 h-12" />,
      route: "/campaigns",
    },
    {
      title: "Painel Admin",
      description: "Gerenciamento completo do sistema e configurações",
      icon: <Settings className="w-12 h-12" />,
      route: "/admin",
      adminOnly: true,
    },
  ];

  const visibleCards = navigationCards.filter((card) => !card.adminOnly || isAdmin);

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
            <p className="text-muted-foreground text-lg">
              Selecione uma seção para começar
            </p>
          </div>

          {/* Announcement Banner */}
          <AnnouncementBanner />

          {/* Daily Mood Card */}
          <DailyMoodCard />

          {/* Weekly Meetings Preview */}
          <WeeklyPreview />

          {/* Navigation Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {visibleCards.map((card, index) => (
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

            {/* Feedback Card */}
            <FeedbackCard onClick={() => setFeedbackModalOpen(true)} />
          </div>

          {/* Feedback Modal */}
          <FeedbackModal 
            open={feedbackModalOpen} 
            onOpenChange={setFeedbackModalOpen} 
          />

          {/* Poll Popup */}
          <PollPopup />
        </main>
      </PageTransition>
    </div>
  );
}
