import React from "react";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessagesManager } from "@/components/admin/MessagesManager";
import { SuggestionsManager } from "@/components/admin/SuggestionsManager";
import { MetricsView } from "@/components/admin/MetricsView";
import { ResourcesManager } from "@/components/admin/ResourcesManager";
import { UsersManager } from "@/components/admin/UsersManager";
import { AcademyManager } from "@/components/admin/AcademyManager";
import PartnersManager from "@/pages/admin/PartnersManager";
import { MessageSquare, Lightbulb, BarChart3, BookOpen, GraduationCap, Building2, Users } from "lucide-react";

export default function Admin() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Painel Administrativo</h1>

        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Sugestões
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Métricas
            </TabsTrigger>
            <TabsTrigger value="resources" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Recursos
            </TabsTrigger>
            <TabsTrigger value="academy" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Academy
            </TabsTrigger>
            <TabsTrigger value="partners" className="gap-2">
              <Building2 className="h-4 w-4" />
              Construtoras
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <MessagesManager />
          </TabsContent>

          <TabsContent value="suggestions">
            <SuggestionsManager />
          </TabsContent>

          <TabsContent value="metrics">
            <MetricsView />
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

          <TabsContent value="users">
            <UsersManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
