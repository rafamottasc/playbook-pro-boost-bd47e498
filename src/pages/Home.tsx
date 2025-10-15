import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, GraduationCap, FolderOpen, Building2, TrendingUp, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PageTransition } from "@/components/PageTransition";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { DailyMoodCard } from "@/components/DailyMoodCard";
import { FeedbackCard } from "@/components/FeedbackCard";
import { FeedbackModal } from "@/components/FeedbackModal";
import { PollPopup } from "@/components/PollPopup";

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
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const navigationCards: NavCard[] = [
    {
      title: "Playbooks de Abordagem",
      description: "Acesse mensagens prontas e abordagens estratégicas para suas conversas",
      icon: <MessageSquare className="w-12 h-12" />,
      route: "/playbooks",
    },
    {
      title: "COMARC Academy",
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
            <h1 className="text-4xl font-bold mb-2 text-foreground">Central COMARC</h1>
            <p className="text-muted-foreground text-lg">
              Selecione uma seção para começar
            </p>
          </div>

          {/* Announcement Banner */}
          <AnnouncementBanner />

          {/* Daily Mood Card */}
          <DailyMoodCard />

          {/* Navigation Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {visibleCards.map((card, index) => (
              <Card
                key={card.route}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in border-2 hover:border-primary/50"
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
