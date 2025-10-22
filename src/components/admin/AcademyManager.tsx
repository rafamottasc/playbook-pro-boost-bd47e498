import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModulesManager } from "./academy/ModulesManager";
import { LessonsManager } from "./academy/LessonsManager";
import { QuestionsManager } from "./academy/QuestionsManager";
import { AcademyMetrics } from "./academy/AcademyMetrics";
import { BookOpen, Play, HelpCircle, BarChart } from "lucide-react";

export function AcademyManager() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Gerenciar Academy</h2>
      <Tabs defaultValue="modules" className="w-full">
        <TabsList>
          <TabsTrigger value="modules" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Módulos
          </TabsTrigger>
          <TabsTrigger value="lessons" className="gap-2">
            <Play className="h-4 w-4" />
            Aulas
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Perguntas
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2">
            <BarChart className="h-4 w-4" />
            Métricas
          </TabsTrigger>
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
