import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Plus, Coffee, Sunrise, Sun, Moon, ClipboardList } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTasks } from "@/hooks/useTasks";
import { useTaskChecklistProgress } from "@/hooks/useTaskChecklistProgress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryManager } from "@/components/tasks/CategoryManager";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { useToast } from "@/hooks/use-toast";
import type { DailyTask } from "@/hooks/useTasks";

// Componente wrapper para drag and drop
function DraggableTaskCard({ task, ...props }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} {...props} />
    </div>
  );
}

export default function DailyTasks() {
  const [taskDate] = useState(new Date().toISOString().split('T')[0]);
  const { tasksByPeriod, stats, isLoading, toggleTask, deleteTask, duplicateTask, postponeTask, moveTask, createTask, updateTask } = useTasks(taskDate);
  const { getChecklistProgress } = useTaskChecklistProgress();
  const [activePeriod, setActivePeriod] = useState<'manha' | 'tarde' | 'noite'>('manha');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [defaultPeriod, setDefaultPeriod] = useState<'manha' | 'tarde' | 'noite' | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleOpenTaskDialog = (period?: 'manha' | 'tarde' | 'noite', task?: DailyTask) => {
    setDefaultPeriod(period);
    setEditingTask(task || null);
    setShowTaskDialog(true);
  };

  const handleSaveTask = async (taskData: Partial<DailyTask>) => {
    try {
      if (editingTask) {
        await updateTask({ id: editingTask.id, ...taskData });
      } else {
        await createTask(taskData as any);
      }
      setShowTaskDialog(false);
      setEditingTask(null);
      setDefaultPeriod(undefined);
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setDeleteConfirm(taskId);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await deleteTask(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const targetPeriod = over.id as 'manha' | 'tarde' | 'noite';

    // Encontra a tarefa em qualquer período
    let taskToMove: DailyTask | undefined;
    for (const period of ['manha', 'tarde', 'noite'] as const) {
      taskToMove = tasksByPeriod[period].find(t => t.id === taskId);
      if (taskToMove) break;
    }

    if (taskToMove && taskToMove.period !== targetPeriod) {
      moveTask(taskId, targetPeriod);
    }
  };

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
              <ClipboardList className="w-6 h-6 text-primary" />
              Minha Agenda
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
              <TabsTrigger value="manha" className="text-xs flex items-center gap-1">
                <Sunrise className="w-3 h-3" /> Manhã ({tasksByPeriod.manha.length})
              </TabsTrigger>
              <TabsTrigger value="tarde" className="text-xs flex items-center gap-1">
                <Sun className="w-3 h-3" /> Tarde ({tasksByPeriod.tarde.length})
              </TabsTrigger>
              <TabsTrigger value="noite" className="text-xs flex items-center gap-1">
                <Moon className="w-3 h-3" /> Noite ({tasksByPeriod.noite.length})
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
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onEdit={(t) => handleOpenTaskDialog(undefined, t)}
                        onDelete={handleDeleteTask}
                        onDuplicate={(id) => {
                          const taskToDup = tasksByPeriod[period].find(t => t.id === id);
                          if (taskToDup) duplicateTask(taskToDup);
                        }}
                        onPostpone={(id) => {
                          const taskToPost = tasksByPeriod[period].find(t => t.id === id);
                          if (taskToPost) postponeTask(taskToPost);
                        }}
                        onMove={(id, p) => {
                          const taskToMove = tasksByPeriod[period].find(t => t.id === id);
                          if (taskToMove) moveTask(taskToMove.id, p);
                        }}
                        checklistProgress={getChecklistProgress(task.id)}
                      />
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
            onClick={() => handleOpenTaskDialog(activePeriod)}
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

        {/* Dialog de Tarefa */}
        <TaskFormDialog
          open={showTaskDialog}
          onOpenChange={setShowTaskDialog}
          task={editingTask}
          defaultPeriod={defaultPeriod}
          onSave={handleSaveTask}
        />

        {/* Confirmação de Exclusão */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A tarefa será excluída permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
                <ClipboardList className="w-8 h-8 text-primary" />
                Minha Agenda Pro
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

        {/* 3 Colunas com Drag and Drop (Desktop) */}
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
          onDragStart={(event) => setActiveId(event.active.id as string)}
        >
          <div className="grid grid-cols-3 gap-6">
            {(['manha', 'tarde', 'noite'] as const).map(period => {
              const Icon = period === 'manha' ? Sunrise : period === 'tarde' ? Sun : Moon;
              const label = period === 'manha' ? 'Manhã' : period === 'tarde' ? 'Tarde' : 'Noite';
              
              return (
                <Card key={period} className="shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Icon className="w-5 h-5" /> {label}
                      </h2>
                      <Button size="sm" onClick={() => handleOpenTaskDialog(period)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <SortableContext 
                      items={tasksByPeriod[period].map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                      id={period}
                    >
                      {tasksByPeriod[period].length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Coffee className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Nenhuma tarefa</p>
                        </div>
                      ) : (
                        <div className="space-y-3 min-h-[400px]">
                          {tasksByPeriod[period].map(task => (
                            <DraggableTaskCard
                              key={task.id}
                              task={task}
                              onToggle={toggleTask}
                              onEdit={(t: DailyTask) => handleOpenTaskDialog(undefined, t)}
                              onDelete={handleDeleteTask}
                              onDuplicate={(id: string) => {
                                const taskToDup = tasksByPeriod[period].find(t => t.id === id);
                                if (taskToDup) duplicateTask(taskToDup);
                              }}
                              onPostpone={(id: string) => {
                                const taskToPost = tasksByPeriod[period].find(t => t.id === id);
                                if (taskToPost) postponeTask(taskToPost);
                              }}
                              onMove={(id: string, p: 'manha' | 'tarde' | 'noite') => {
                                const taskToMove = tasksByPeriod[period].find(t => t.id === id);
                                if (taskToMove) moveTask(taskToMove.id, p);
                              }}
                              checklistProgress={getChecklistProgress(task.id)}
                            />
                          ))}
                        </div>
                      )}
                    </SortableContext>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DndContext>
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

      {/* Dialog de Tarefa */}
      <TaskFormDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        task={editingTask}
        defaultPeriod={defaultPeriod}
        onSave={handleSaveTask}
      />

      {/* Confirmação de Exclusão */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A tarefa será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
