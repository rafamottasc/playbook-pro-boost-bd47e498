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
import { useTaskStatuses } from "@/hooks/useTaskStatuses";
import { useTaskChecklistProgress } from "@/hooks/useTaskChecklistProgress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryManager } from "@/components/tasks/CategoryManager";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { StatusColumnHeader } from "@/components/tasks/StatusColumnHeader";
import { CreateStatusButton } from "@/components/tasks/CreateStatusButton";
import { StatusColorPicker } from "@/components/tasks/StatusColorPicker";
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <TaskCard task={task} {...props} />
    </div>
  );
}

// Componente de área droppable para status (suporta status_id)
function DroppableStatus({ 
  status, 
  children 
}: { 
  status: string; // Aceita tanto 'todo' | 'in_progress' | 'done' quanto UUID
  children: React.ReactNode 
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "min-h-[200px] rounded-lg transition-colors flex-1",
        isOver && "bg-primary/10 border-2 border-primary border-dashed"
      )}
    >
      {children}
    </div>
  );
}

export default function DailyTasks() {
  const { tasksByStatus, tasksByStatusId, stats, isLoading, toggleTask, deleteTask, duplicateTask, moveTaskToStatus, createTask, updateTask, toggleChecklistItem } = useTasks();
  const { statuses, createStatus, updateStatus, deleteStatus, canCreateMore, maxStatuses } = useTaskStatuses();
  const { getChecklistProgress } = useTaskChecklistProgress();
  const [activeStatus, setActiveStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<'todo' | 'in_progress' | 'done' | undefined>();
  const [defaultStatusId, setDefaultStatusId] = useState<string | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [colorPickerStatus, setColorPickerStatus] = useState<{ id: string; name: string; color: string } | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleOpenTaskDialog = (status?: 'todo' | 'in_progress' | 'done', task?: DailyTask, statusId?: string) => {
    setDefaultStatus(status);
    setDefaultStatusId(statusId);
    setEditingTask(task || null);
    setShowTaskDialog(true);
  };

  const handleSaveTask = async (taskData: Partial<DailyTask>) => {
    try {
      if (editingTask) {
        await updateTask({ id: editingTask.id, ...taskData });
      } else {
        // Criar com status ou status_id definido
        await createTask({ 
          ...taskData, 
          status: taskData.status || defaultStatus || 'todo',
          status_id: defaultStatusId,
          done: (taskData.status || defaultStatus) === 'done'
        } as any);
      }
      setShowTaskDialog(false);
      setEditingTask(null);
      setDefaultStatus(undefined);
      setDefaultStatusId(undefined);
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
              Organize suas tarefas diárias
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

          {/* Tabs de Status com Drag and Drop */}
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
          >
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
                  <DroppableStatus status={status}>
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
                        <SortableContext 
                          items={tasksByStatus[status].map(t => t.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {tasksByStatus[status].map(task => (
                            <DraggableTaskCard
                              key={task.id}
                              task={task}
                              onToggle={toggleTask}
                              onEdit={(t: DailyTask) => handleOpenTaskDialog(undefined, t)}
                              onDelete={handleDeleteTask}
                              onDuplicate={(id: string) => {
                                const taskToDup = tasksByStatus[status].find(t => t.id === id);
                                if (taskToDup) duplicateTask(taskToDup);
                              }}
                              onToggleChecklistItem={toggleChecklistItem}
                              checklistProgress={getChecklistProgress(task.id)}
                              onMoveToStatus={moveTaskToStatus}
                            />
                          ))}
                        </SortableContext>
                      </div>
                    )}
                  </DroppableStatus>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => handleOpenTaskDialog(status)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Tarefa
                  </Button>
                </TabsContent>
              ))}
            </Tabs>
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
                  Organize suas tarefas e projetos
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

        {/* Colunas Kanban Dinâmicas com Drag and Drop - Horizontal Scroll */}
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
          onDragStart={(event) => setActiveId(event.active.id as string)}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {/* Renderizar colunas dinâmicas ordenadas */}
            {statuses
              .sort((a, b) => a.display_order - b.display_order)
              .map(status => {
                const statusTasks = tasksByStatusId[status.id] || [];
                
                return (
                  <Card key={status.id} className="min-w-[320px] max-w-[320px] shadow-sm flex flex-col">
                    <StatusColumnHeader
                      status={status}
                      taskCount={statusTasks.length}
                      onEditName={(newName) => updateStatus({ id: status.id, name: newName })}
                      onEditColor={() => setColorPickerStatus({ id: status.id, name: status.name, color: status.color })}
                      onDelete={() => deleteStatus(status.id)}
                      canDelete={statusTasks.length === 0}
                    />
                    
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <DroppableStatus status={status.id}>
                        <SortableContext 
                          items={statusTasks.map(t => t.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {statusTasks.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                              <p className="text-sm">Nenhuma tarefa</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {statusTasks.map(task => (
                                <DraggableTaskCard
                                  key={task.id}
                                  task={task}
                                  onToggle={toggleTask}
                                  onEdit={(t: DailyTask) => handleOpenTaskDialog(undefined, t)}
                                  onDelete={handleDeleteTask}
                                  onDuplicate={(id: string) => {
                                    const taskToDup = statusTasks.find(t => t.id === id);
                                    if (taskToDup) duplicateTask(taskToDup);
                                  }}
                                  onToggleChecklistItem={toggleChecklistItem}
                                  checklistProgress={getChecklistProgress(task.id)}
                                  onMoveToStatus={moveTaskToStatus}
                                />
                              ))}
                            </div>
                          )}
                        </SortableContext>
                      </DroppableStatus>

                      <Button 
                        variant="outline" 
                        className="w-full mt-3"
                        onClick={() => handleOpenTaskDialog(undefined, undefined, status.id)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Tarefa
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            
            {/* Botão criar nova lista */}
            <CreateStatusButton 
              onCreateStatus={(name) => createStatus({ name })}
              canCreate={canCreateMore}
              maxStatuses={maxStatuses}
              currentCount={statuses.length}
            />
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

      {/* Color Picker Dialog */}
      {colorPickerStatus && (
        <StatusColorPicker
          open={!!colorPickerStatus}
          onOpenChange={(open) => !open && setColorPickerStatus(null)}
          currentColor={colorPickerStatus.color}
          statusName={colorPickerStatus.name}
          onSelectColor={(color) => {
            updateStatus({ id: colorPickerStatus.id, color });
            setColorPickerStatus(null);
          }}
        />
      )}

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
