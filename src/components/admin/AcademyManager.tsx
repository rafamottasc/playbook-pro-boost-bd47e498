import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModulesManager } from "./academy/ModulesManager";
import { LessonsManager } from "./academy/LessonsManager";
import { QuestionsManager } from "./academy/QuestionsManager";
import { AcademyMetrics } from "./academy/AcademyMetrics";

export function AcademyManager() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Gerenciar Academy</h2>
      <Tabs defaultValue="modules" className="w-full">
        <TabsList>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="lessons">Aulas</TabsTrigger>
          <TabsTrigger value="questions">Perguntas</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="modules">
          <ModulesManager />
        </TabsContent>

        <TabsContent value="lessons">
          <LessonsManager />
        </TabsContent>

        <TabsContent value="questions">
          <QuestionsManager />
        </TabsContent>

        <TabsContent value="metrics">
          <AcademyMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
