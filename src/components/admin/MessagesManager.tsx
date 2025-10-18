import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessagesContent } from "./messages/MessagesContent";
import { SuggestionsManager } from "./messages/SuggestionsManager";
import { MetricsView } from "./messages/MetricsView";
import { FileText, Lightbulb, BarChart3 } from "lucide-react";

export function MessagesManager() {
  return (
    <div className="space-y-6">
      {/* Header com breadcrumb visual */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span>Playbook</span>
          <span>/</span>
          <span className="text-foreground font-medium">Mensagens</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Gerencie as mensagens do playbook, veja sugestões e acompanhe métricas de engajamento.
        </p>
      </div>

      {/* Abas internas leves com ícones */}
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="messages" className="gap-2">
            <FileText className="h-4 w-4" />
            <span>Mensagens</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            <span>Sugestões</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Métricas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          <MessagesContent />
        </TabsContent>

        <TabsContent value="suggestions" className="mt-6">
          <SuggestionsManager />
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <MetricsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
