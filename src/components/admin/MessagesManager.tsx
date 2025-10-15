import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessagesContent } from "./messages/MessagesContent";
import { SuggestionsManager } from "./messages/SuggestionsManager";
import { MetricsView } from "./messages/MetricsView";

export function MessagesManager() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Gerenciar Mensagens</h2>
      <Tabs defaultValue="messages" className="w-full">
        <TabsList>
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
          <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <MessagesContent />
        </TabsContent>

        <TabsContent value="suggestions">
          <SuggestionsManager />
        </TabsContent>

        <TabsContent value="metrics">
          <MetricsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
