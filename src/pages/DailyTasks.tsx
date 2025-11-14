import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Settings, Plus, ClipboardList } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
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
    touchAction: 'none' as const,
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
  const { tasksByStatusId, stats, isLoading, toggleTask, deleteTask, duplicateTask, moveTaskToStatus, createTask, updateTask, toggleChecklistItem } = useTasks();
  const { statuses, createStatus, updateStatus, deleteStatus, canCreateMore, maxStatuses } = useTaskStatuses();
  const { getChecklistProgress } = useTaskChecklistProgress();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [defaultStatusId, setDefaultStatusId] = useState<string | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [colorPickerStatus, setColorPickerStatus] = useState<{ id: string; name: string; color: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 8,
      },
    })
  );

  const handleOpenTaskDialog = (task?: DailyTask, statusId?: string) => {
    setDefaultStatusId(statusId);
    setEditingTask(task || null);
    setShowTaskDialog(true);
  };

  const handleSaveTask = async (taskData: Partial<DailyTask>) => {
    try {
      if (editingTask) {
        await updateTask({ id: editingTask.id, ...taskData });
      } else {
        // Criar com status_id definido
        await createTask({ 
          ...taskData, 
          status_id: defaultStatusId || statuses[0]?.id, // Usa primeiro status como padrão
          done: false
        } as any);
      }
      setShowTaskDialog(false);
      setEditingTask(null);
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
    let targetStatus: string | undefined;
    
    // Checar se foi solto sobre um status id válido
    if (statuses.some(s => s.id === over.id)) {
      targetStatus = over.id as string;
    } else {
      // Se foi solto sobre uma tarefa, encontrar o status dessa tarefa
      for (const statusId of statuses.map(s => s.id)) {
        if (tasksByStatusId[statusId]?.some(t => t.id === over.id)) {
          targetStatus = statusId;
          break;
        }
      }
    }

    if (!targetStatus) return;

    // Encontra a tarefa arrastada
    let taskToMove: DailyTask | undefined;
    for (const statusId of statuses.map(s => s.id)) {
      taskToMove = tasksByStatusId[statusId]?.find(t => t.id === taskId);
      if (taskToMove) break;
    }

    if (taskToMove && taskToMove.status_id !== targetStatus) {
      moveTaskToStatus(taskId, targetStatus);
    }
  };

  const handleCreateStatus = async (name: string) => {
    try {
      await createStatus({ name });
      toast({
        title: "Etapa criada",
        description: `A etapa "${name}" foi criada com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao criar etapa:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Layout único - Kanban responsivo para mobile e desktop
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-2 md:px-4 py-4 md:py-8">
        {/* Header Responsivo */}
        <Card className="mb-4 md:mb-6 shadow-sm">
          <CardContent className={cn("p-4", !isMobile && "md:p-6")}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className={cn(
                  "font-bold flex items-center gap-2",
                  isMobile ? "text-2xl" : "text-3xl"
                )}>
                  <ClipboardList className={cn(isMobile ? "w-6 h-6" : "w-8 h-8", "text-primary")} />
                  Minhas Tarefas
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isMobile ? "Organize suas tarefas" : "Organize suas tarefas e projetos"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs md:text-sm text-muted-foreground">Progresso</p>
                <p className={cn("font-bold text-primary", isMobile ? "text-lg" : "text-2xl")}>
                  {stats.completed}/{stats.total}
                </p>
                <Progress value={stats.completionRate} className={cn("h-2 mt-2", isMobile ? "w-20" : "w-32")} />
              </div>
            </div>
            
            <div className={cn("flex gap-2 mt-4", isMobile && "flex-col")}>
              <Button 
                variant="outline" 
                onClick={() => setShowCategoryManager(true)}
                className={cn(isMobile && "w-full")}
              >
                <Settings className="w-4 h-4 mr-2" />
                Gerenciar Categorias
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board - Mobile e Desktop */}
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
          onDragStart={(event) => setActiveId(event.active.id as string)}
        >
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4">
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
                                  onEdit={handleOpenTaskDialog}
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
                        onClick={() => handleOpenTaskDialog(undefined, status.id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
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
        defaultStatusId={defaultStatusId}
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
        <AlertDialogContent className="mx-4">
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

      {colorPickerStatus && (
        <StatusColorPicker
          open={!!colorPickerStatus}
          onOpenChange={(open) => !open && setColorPickerStatus(null)}
          statusName={colorPickerStatus.name}
          currentColor={colorPickerStatus.color}
          onSelectColor={(color) => {
            updateStatus({ id: colorPickerStatus.id, color });
            setColorPickerStatus(null);
          }}
        />
      )}
    </div>
  );
}
