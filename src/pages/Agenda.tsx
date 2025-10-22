import { Header } from "@/components/Header";
import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Agenda() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageTransition>
        <main className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
                <Calendar className="h-10 w-10 text-primary" />
                Agenda de Reuniões
              </h1>
              <p className="text-muted-foreground text-lg mt-2">
                Gerencie suas reuniões e reserve salas
              </p>
            </div>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Nova Reunião
            </Button>
          </div>

          {/* Placeholder Content - Será implementado na FASE 5 */}
          <Card className="border-border/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <CardHeader>
              <CardTitle>Calendário de Reuniões</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as reuniões agendadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[500px] bg-muted/30 rounded-lg border-2 border-dashed border-border">
                <div className="text-center">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Calendário em Desenvolvimento
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    O calendário completo com visualização semanal/mensal será implementado na próxima fase
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </PageTransition>
    </div>
  );
}
