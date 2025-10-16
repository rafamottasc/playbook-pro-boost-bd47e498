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
import { MessageSquare, BookOpen, GraduationCap, Building2, Users, Megaphone, Smile, MessageCircle, ListOrdered, PieChart } from "lucide-react";

export default function Admin() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Painel Administrativo</h1>

        <Tabs defaultValue="funnels" className="w-full">
          <TabsList className="mb-6 w-full justify-start">
            <TabsTrigger value="funnels" className="gap-2">
              <ListOrdered className="h-4 w-4" />
              <span className="hidden sm:inline">Funis</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Mensagens</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Recursos</span>
            </TabsTrigger>
            <TabsTrigger value="academy" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Academy</span>
            </TabsTrigger>
            <TabsTrigger value="partners" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Construtoras</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Avisos</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="mood" className="gap-2">
              <Smile className="h-4 w-4" />
              <span className="hidden sm:inline">Clima</span>
            </TabsTrigger>
            <TabsTrigger value="feedbacks" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Feedbacks</span>
            </TabsTrigger>
            <TabsTrigger value="polls" className="gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Enquetes</span>
            </TabsTrigger>
          </TabsList>

        <TabsContent value="funnels">
          <FunnelsManager />
        </TabsContent>

        <TabsContent value="messages">
          <MessagesManager />
        </TabsContent>

          <TabsContent value="resources">
            <ResourcesManager />
          </TabsContent>

          <TabsContent value="academy">
            <AcademyManager />
          </TabsContent>

          <TabsContent value="partners">
            <PartnersManager />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsManager />
          </TabsContent>

          <TabsContent value="users">
            <UsersManager />
          </TabsContent>

          <TabsContent value="mood">
            <MoodMetricsOptimized />
          </TabsContent>

          <TabsContent value="feedbacks">
            <FeedbacksManager />
          </TabsContent>

          <TabsContent value="polls">
            <PollsManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
