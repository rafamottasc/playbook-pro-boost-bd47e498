import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Plus, Circle, PlayCircle, CheckCircle2, ClipboardList } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
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
import { cn } from "@/lib/utils";
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

// Componente de área droppable para status
function DroppableStatus({ 
  status, 
  children 
}: { 
  status: 'todo' | 'in_progress' | 'done'; 
  children: React.ReactNode 
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "min-h-[200px] rounded-lg transition-colors",
        isOver && "bg-primary/10 border-2 border-primary border-dashed"
      )}
    >
      {children}
    </div>
  );
}

export default function DailyTasks() {
  const [taskDate] = useState(new Date().toISOString().split('T')[0]);
  const { tasksByStatus, stats, isLoading, toggleTask, deleteTask, duplicateTask, moveTaskToStatus, createTask, updateTask, toggleChecklistItem } = useTasks(taskDate);
  const { getChecklistProgress } = useTaskChecklistProgress();
  const [activeStatus, setActiveStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<'todo' | 'in_progress' | 'done' | undefined>();
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

  const handleOpenTaskDialog = (status?: 'todo' | 'in_progress' | 'done', task?: DailyTask) => {
    setDefaultStatus(status);
    setEditingTask(task || null);
    setShowTaskDialog(true);
  };

  const handleSaveTask = async (taskData: Partial<DailyTask>) => {
    try {
      if (editingTask) {
        await updateTask({ id: editingTask.id, ...taskData });
      } else {
        // Criar com status definido
        await createTask({ 
          ...taskData, 
          status: taskData.status || defaultStatus || 'todo',
          done: (taskData.status || defaultStatus) === 'done'
        } as any);
      }
      setShowTaskDialog(false);
      setEditingTask(null);
      setDefaultStatus(undefined);
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
    
    // Verificar se foi solto sobre um status
    let targetStatus: 'todo' | 'in_progress' | 'done' | undefined;
    
    if (['todo', 'in_progress', 'done'].includes(over.id as string)) {
      targetStatus = over.id as 'todo' | 'in_progress' | 'done';
    } else {
      // Se foi solto sobre uma tarefa, encontrar o status dessa tarefa
      for (const status of ['todo', 'in_progress', 'done'] as const) {
        if (tasksByStatus[status].some(t => t.id === over.id)) {
          targetStatus = status;
          break;
        }
      }
    }

    if (!targetStatus) return;

    // Encontra a tarefa arrastada
    let taskToMove: DailyTask | undefined;
    for (const status of ['todo', 'in_progress', 'done'] as const) {
      taskToMove = tasksByStatus[status].find(t => t.id === taskId);
      if (taskToMove) break;
    }

    if (taskToMove && taskToMove.status !== targetStatus) {
      moveTaskToStatus(taskId, targetStatus);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mobile Layout - Tabs
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 pb-24">
          {/* Header Compacto */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" />
              Minhas Tarefas
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

          {/* Tabs de Status */}
          <Tabs value={activeStatus} onValueChange={(v) => setActiveStatus(v as any)}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="todo" className="text-xs flex items-center gap-1">
                <Circle className="w-3 h-3" /> Para Fazer ({tasksByStatus.todo.length})
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="text-xs flex items-center gap-1">
                <PlayCircle className="w-3 h-3" /> Andamento ({tasksByStatus.in_progress.length})
              </TabsTrigger>
              <TabsTrigger value="done" className="text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Concluído ({tasksByStatus.done.length})
              </TabsTrigger>
            </TabsList>

            {/* Conteúdo de cada status */}
            {(['todo', 'in_progress', 'done'] as const).map(status => (
              <TabsContent key={status} value={status}>
                {tasksByStatus[status].length === 0 ? (
                  <div className="text-center py-12">
                    {status === 'todo' && <Circle className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />}
                    {status === 'in_progress' && <PlayCircle className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />}
                    {status === 'done' && <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />}
                    <p className="text-sm text-muted-foreground">
                      {status === 'todo' && 'Nenhuma tarefa para fazer'}
                      {status === 'in_progress' && 'Nenhuma tarefa em andamento'}
                      {status === 'done' && 'Nenhuma tarefa concluída'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasksByStatus[status].map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onEdit={(t) => handleOpenTaskDialog(undefined, t)}
                        onDelete={handleDeleteTask}
                        onDuplicate={(id) => {
                          const taskToDup = tasksByStatus[status].find(t => t.id === id);
                          if (taskToDup) duplicateTask(taskToDup);
                        }}
                        onToggleChecklistItem={toggleChecklistItem}
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
            className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-40"
            onClick={() => handleOpenTaskDialog(activeStatus)}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </main>

        {/* Dialogs */}
        <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerenciar Categorias</DialogTitle>
            </DialogHeader>
            <CategoryManager />
          </DialogContent>
        </Dialog>

        <TaskFormDialog
          open={showTaskDialog}
          onOpenChange={setShowTaskDialog}
          task={editingTask}
          defaultStatus={defaultStatus}
          onSave={handleSaveTask}
        />

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

  // Desktop Layout - 3 Colunas
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Header Desktop */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <ClipboardList className="w-8 h-8 text-primary" />
                  Minhas Tarefas
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

        {/* 3 Colunas Kanban com Drag and Drop */}
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
          onDragStart={(event) => setActiveId(event.active.id as string)}
        >
          <div className="grid grid-cols-3 gap-6">
            {/* Para Fazer */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-b-primary">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Circle className="w-5 h-5 text-foreground" /> Para Fazer
                  </h2>
                  <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    {tasksByStatus.todo.length}
                  </span>
                </div>

                <DroppableStatus status="todo">
                  <SortableContext 
                    items={tasksByStatus.todo.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {tasksByStatus.todo.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Circle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Nenhuma tarefa</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tasksByStatus.todo.map(task => (
                          <DraggableTaskCard
                            key={task.id}
                            task={task}
                            onToggle={toggleTask}
                            onEdit={(t: DailyTask) => handleOpenTaskDialog(undefined, t)}
                            onDelete={handleDeleteTask}
                            onDuplicate={(id: string) => {
                              const taskToDup = tasksByStatus.todo.find(t => t.id === id);
                              if (taskToDup) duplicateTask(taskToDup);
                            }}
                            onToggleChecklistItem={toggleChecklistItem}
                            checklistProgress={getChecklistProgress(task.id)}
                          />
                        ))}
                      </div>
                    )}
                  </SortableContext>
                </DroppableStatus>

                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => handleOpenTaskDialog('todo')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Tarefa
                </Button>
              </CardContent>
            </Card>

            {/* Em Andamento */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-b-primary">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-foreground" /> Em Andamento
                  </h2>
                  <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    {tasksByStatus.in_progress.length}
                  </span>
                </div>

                <DroppableStatus status="in_progress">
                  <SortableContext 
                    items={tasksByStatus.in_progress.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {tasksByStatus.in_progress.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <PlayCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Nenhuma tarefa</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tasksByStatus.in_progress.map(task => (
                          <DraggableTaskCard
                            key={task.id}
                            task={task}
                            onToggle={toggleTask}
                            onEdit={(t: DailyTask) => handleOpenTaskDialog(undefined, t)}
                            onDelete={handleDeleteTask}
                            onDuplicate={(id: string) => {
                              const taskToDup = tasksByStatus.in_progress.find(t => t.id === id);
                              if (taskToDup) duplicateTask(taskToDup);
                            }}
                            onToggleChecklistItem={toggleChecklistItem}
                            checklistProgress={getChecklistProgress(task.id)}
                          />
                        ))}
                      </div>
                    )}
                  </SortableContext>
                </DroppableStatus>

                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => handleOpenTaskDialog('in_progress')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Tarefa
                </Button>
              </CardContent>
            </Card>

            {/* Concluído */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-b-primary">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-foreground" /> Concluído
                  </h2>
                  <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    {tasksByStatus.done.length}
                  </span>
                </div>

                <DroppableStatus status="done">
                  <SortableContext 
                    items={tasksByStatus.done.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {tasksByStatus.done.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Nenhuma tarefa</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tasksByStatus.done.map(task => (
                          <DraggableTaskCard
                            key={task.id}
                            task={task}
                            onToggle={toggleTask}
                            onEdit={(t: DailyTask) => handleOpenTaskDialog(undefined, t)}
                            onDelete={handleDeleteTask}
                            onDuplicate={(id: string) => {
                              const taskToDup = tasksByStatus.done.find(t => t.id === id);
                              if (taskToDup) duplicateTask(taskToDup);
                            }}
                            onToggleChecklistItem={toggleChecklistItem}
                            checklistProgress={getChecklistProgress(task.id)}
                          />
                        ))}
                      </div>
                    )}
                  </SortableContext>
                </DroppableStatus>

                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => handleOpenTaskDialog('done')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Tarefa
                </Button>
              </CardContent>
            </Card>
          </div>
        </DndContext>
      </main>

      {/* Dialogs */}
      <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>
          <CategoryManager />
        </DialogContent>
      </Dialog>

      <TaskFormDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        task={editingTask}
        defaultStatus={defaultStatus}
        onSave={handleSaveTask}
      />

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
