import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessagesManager } from "@/components/admin/MessagesManager";
import { SuggestionsManager } from "@/components/admin/SuggestionsManager";
import { MetricsView } from "@/components/admin/MetricsView";
import { ResourcesManager } from "@/components/admin/ResourcesManager";
import { UsersManager } from "@/components/admin/UsersManager";
import { AcademyManager } from "@/components/admin/AcademyManager";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <Button 
            onClick={() => navigate("/admin/campaigns/partners")}
            variant="outline"
            className="gap-2"
          >
            <Building2 className="h-4 w-4" />
            Gestão de Construtoras
          </Button>
        </div>

        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="messages">Mensagens</TabsTrigger>
            <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
            <TabsTrigger value="resources">Recursos</TabsTrigger>
            <TabsTrigger value="academy">Academy</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
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

          <TabsContent value="users">
            <UsersManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
