import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Plus, Coffee } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryManager } from "@/components/tasks/CategoryManager";

export default function DailyTasks() {
  const [taskDate] = useState(new Date().toISOString().split('T')[0]);
  const { tasksByPeriod, stats, isLoading } = useTasks(taskDate);
  const [activePeriod, setActivePeriod] = useState<'manha' | 'tarde' | 'noite'>('manha');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          {/* Header Compacto */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              📋 Minha Agenda
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(taskDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          {/* Progresso */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progresso</span>
                <span className="font-semibold">{stats.completed}/{stats.total}</span>
              </div>
              <Progress value={stats.completionRate} className="h-2" />
            </CardContent>
          </Card>

          {/* Botão Gerenciar Categorias */}
          <Button 
            variant="outline" 
            className="w-full mb-4"
            onClick={() => setShowCategoryManager(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Gerenciar Categorias
          </Button>

          {/* Tabs de Períodos */}
          <Tabs value={activePeriod} onValueChange={(v) => setActivePeriod(v as any)}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="manha" className="text-xs">
                🌅 Manhã ({tasksByPeriod.manha.length})
              </TabsTrigger>
              <TabsTrigger value="tarde" className="text-xs">
                ☀️ Tarde ({tasksByPeriod.tarde.length})
              </TabsTrigger>
              <TabsTrigger value="noite" className="text-xs">
                🌙 Noite ({tasksByPeriod.noite.length})
              </TabsTrigger>
            </TabsList>

            {/* Conteúdo de cada período */}
            {(['manha', 'tarde', 'noite'] as const).map(period => (
              <TabsContent key={period} value={period}>
                {tasksByPeriod[period].length === 0 ? (
                  <div className="text-center py-12">
                    <Coffee className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Nenhuma tarefa neste período</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasksByPeriod[period].map(task => (
                      <Card key={task.id}>
                        <CardContent className="p-4">
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">{task.scheduled_time}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* FAB: Botão Flutuante "+" */}
          <Button
            size="lg"
            className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </main>

        {/* Dialog de Categorias */}
        <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerenciar Categorias</DialogTitle>
            </DialogHeader>
            <CategoryManager />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Header Desktop */}
        <Card className="mb-6 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  📋 Minha Agenda Pro
                </h1>
                <p className="text-muted-foreground">
                  {format(new Date(taskDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Progresso</p>
                <p className="text-2xl font-bold text-primary">
                  {stats.completed}/{stats.total}
                </p>
                <Progress value={stats.completionRate} className="w-32 h-2 mt-2" />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowCategoryManager(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Gerenciar Categorias
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 3 Colunas (Desktop) */}
        <div className="grid grid-cols-3 gap-6">
          {(['manha', 'tarde', 'noite'] as const).map(period => {
            const icon = period === 'manha' ? '🌅' : period === 'tarde' ? '☀️' : '🌙';
            const label = period === 'manha' ? 'Manhã' : period === 'tarde' ? 'Tarde' : 'Noite';
            
            return (
              <Card key={period} className="shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">
                      {icon} {label}
                    </h2>
                    <Button size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {tasksByPeriod[period].length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Coffee className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Nenhuma tarefa</p>
                    </div>
                  ) : (
                    <div className="space-y-3 min-h-[400px]">
                      {tasksByPeriod[period].map(task => (
                        <Card key={task.id}>
                          <CardContent className="p-4">
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">{task.scheduled_time}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Dialog de Categorias */}
      <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>
          <CategoryManager />
        </DialogContent>
      </Dialog>
    </div>
  );
}
