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
import { BookOpen, Rocket, Heart, Settings } from "lucide-react";
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
            <TabsTrigger value="playbook" className="gap-2">
              <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline">Playbook</span>
            </TabsTrigger>
            <TabsTrigger value="cultura" className="gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Cultura</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Sistema</span>
            </TabsTrigger>
          </TabsList>

          {/* CONTEÚDO */}
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

          {/* PLAYBOOK */}
          <TabsContent value="playbook" className="space-y-4">
            <Tabs defaultValue="messages" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="messages">Mensagens</TabsTrigger>
                <TabsTrigger value="funis">Funis</TabsTrigger>
                <TabsTrigger value="construtoras">Construtoras</TabsTrigger>
              </TabsList>
              
              <TabsContent value="messages">
                <MessagesManager />
              </TabsContent>
              
              <TabsContent value="funis">
                <FunnelsManager />
              </TabsContent>
              
              <TabsContent value="construtoras">
                <PartnersManager />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* CULTURA */}
          <TabsContent value="cultura" className="space-y-4">
            <Tabs defaultValue="avisos" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="avisos">Avisos</TabsTrigger>
                <TabsTrigger value="enquetes">Enquetes</TabsTrigger>
                <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
                <TabsTrigger value="clima">Clima</TabsTrigger>
              </TabsList>
              
              <TabsContent value="avisos">
                <AnnouncementsManager />
              </TabsContent>
              
              <TabsContent value="enquetes">
                <PollsManager />
              </TabsContent>
              
              <TabsContent value="feedbacks">
                <FeedbacksManager />
              </TabsContent>
              
              <TabsContent value="clima">
                <MoodMetricsOptimized />
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
