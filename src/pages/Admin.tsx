import React from "react";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessagesManager } from "@/components/admin/MessagesManager";
import { ResourcesManager } from "@/components/admin/ResourcesManager";
import { UsersManager } from "@/components/admin/UsersManager";
import { AcademyManager } from "@/components/admin/AcademyManager";
import { FunnelsManager } from "@/components/admin/FunnelsManager";
import { AnnouncementsManager } from "@/components/admin/AnnouncementsManager";
import PartnersManager from "@/pages/admin/PartnersManager";
import MoodMetricsOptimized from "@/components/admin/MoodMetricsOptimized";
import { FeedbacksManager } from "@/components/admin/FeedbacksManager";
import { PollsManager } from "@/components/admin/PollsManager";
import { BookOpen, Building2, Users, Settings, TrendingUp, Heart } from "lucide-react";
import { CubManager } from "@/components/admin/CubManager";
import { ThemeManager } from "@/components/admin/ThemeManager";

export default function Admin() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Painel Administrativo</h1>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="mb-6 w-full justify-start flex-wrap gap-2">
            <TabsTrigger value="content" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Conteúdo</span>
            </TabsTrigger>
            <TabsTrigger value="communication" className="gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Comunicação</span>
            </TabsTrigger>
            <TabsTrigger value="engagement" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Engajamento</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Vendas</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Sistema</span>
            </TabsTrigger>
          </TabsList>

          {/* CONTEÚDO & TREINAMENTO */}
          <TabsContent value="content" className="space-y-4">
            <Tabs defaultValue="resources" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="resources">Recursos</TabsTrigger>
                <TabsTrigger value="academy">Academy</TabsTrigger>
              </TabsList>
              
              <TabsContent value="resources">
                <ResourcesManager />
              </TabsContent>
              
              <TabsContent value="academy">
                <AcademyManager />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* COMUNICAÇÃO */}
          <TabsContent value="communication" className="space-y-4">
            <Tabs defaultValue="messages" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="messages">Mensagens</TabsTrigger>
                <TabsTrigger value="announcements">Avisos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="messages">
                <MessagesManager />
              </TabsContent>
              
              <TabsContent value="announcements">
                <AnnouncementsManager />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ENGAJAMENTO & CULTURA */}
          <TabsContent value="engagement" className="space-y-4">
            <Tabs defaultValue="feedbacks" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
                <TabsTrigger value="polls">Enquetes</TabsTrigger>
                <TabsTrigger value="mood">Clima</TabsTrigger>
              </TabsList>
              
              <TabsContent value="feedbacks">
                <FeedbacksManager />
              </TabsContent>
              
              <TabsContent value="polls">
                <PollsManager />
              </TabsContent>
              
              <TabsContent value="mood">
                <MoodMetricsOptimized />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* VENDAS & PARCEIROS */}
          <TabsContent value="sales" className="space-y-4">
            <Tabs defaultValue="funnels" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="funnels">Funis</TabsTrigger>
                <TabsTrigger value="partners">Construtoras</TabsTrigger>
              </TabsList>
              
              <TabsContent value="funnels">
                <FunnelsManager />
              </TabsContent>
              
              <TabsContent value="partners">
                <PartnersManager />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* SISTEMA */}
          <TabsContent value="system" className="space-y-4">
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="users">Usuários</TabsTrigger>
                <TabsTrigger value="calculator">Calculadora</TabsTrigger>
                <TabsTrigger value="theme">Aparência</TabsTrigger>
              </TabsList>
              
              <TabsContent value="users">
                <UsersManager />
              </TabsContent>
              
              <TabsContent value="calculator">
                <CubManager />
              </TabsContent>
              
              <TabsContent value="theme">
                <ThemeManager />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
