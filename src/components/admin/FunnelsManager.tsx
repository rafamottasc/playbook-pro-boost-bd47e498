import { useState } from "react";
import { useFunnels, Funnel } from "@/hooks/useFunnels";
import { useStages } from "@/hooks/useStages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        {children}
      </div>
    </div>
  );
}

export function FunnelsManager() {
  const { funnels, loading, createFunnel, updateFunnel, deleteFunnel, reorderFunnels } = useFunnels();
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | undefined>();
  const { stages, createStage, updateStage, deleteStage, reorderStages } = useStages(selectedFunnelId);

  const [isCreatingFunnel, setIsCreatingFunnel] = useState(false);
  const [isEditingFunnel, setIsEditingFunnel] = useState(false);
  const [isCreatingStage, setIsCreatingStage] = useState(false);
  const [isEditingStage, setIsEditingStage] = useState(false);

  const [funnelForm, setFunnelForm] = useState({ name: "", slug: "", description: "", emoji: "📊" });
  const [stageForm, setStageForm] = useState({ name: "" });
  const [editingFunnelId, setEditingFunnelId] = useState<string | null>(null);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: "funnel" | "stage"; id: string; name: string }>({
    open: false,
    type: "funnel",
    id: "",
    name: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedFunnel = funnels.find((f) => f.id === selectedFunnelId);

  const handleCreateFunnel = async () => {
    const result = await createFunnel(funnelForm);
    if (result.success) {
      setIsCreatingFunnel(false);
      setFunnelForm({ name: "", slug: "", description: "", emoji: "📊" });
    }
  };

  const handleUpdateFunnel = async () => {
    if (!editingFunnelId) return;
    const result = await updateFunnel(editingFunnelId, funnelForm);
    if (result.success) {
      setIsEditingFunnel(false);
      setEditingFunnelId(null);
      setFunnelForm({ name: "", slug: "", description: "", emoji: "📊" });
    }
  };

  const handleDeleteFunnel = async () => {
    await deleteFunnel(deleteDialog.id);
    setDeleteDialog({ open: false, type: "funnel", id: "", name: "" });
    if (selectedFunnelId === deleteDialog.id) {
      setSelectedFunnelId(undefined);
    }
  };

  const handleCreateStage = async () => {
    if (!selectedFunnelId) return;
    const result = await createStage({ ...stageForm, funnel_id: selectedFunnelId });
    if (result.success) {
      setIsCreatingStage(false);
      setStageForm({ name: "" });
    }
  };

  const handleUpdateStage = async () => {
    if (!editingStageId) return;
    const result = await updateStage(editingStageId, stageForm);
    if (result.success) {
      setIsEditingStage(false);
      setEditingStageId(null);
      setStageForm({ name: "" });
    }
  };

  const handleDeleteStage = async () => {
    await deleteStage(deleteDialog.id, deleteDialog.name);
    setDeleteDialog({ open: false, type: "funnel", id: "", name: "" });
  };

  const handleFunnelDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = funnels.findIndex((f) => f.id === active.id);
    const newIndex = funnels.findIndex((f) => f.id === over.id);

    const reordered = arrayMove(funnels, oldIndex, newIndex);
    reorderFunnels(reordered);
  };

  const handleStageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);

    const reordered = arrayMove(stages, oldIndex, newIndex);
    reorderStages(reordered);
  };

  const startEditFunnel = (funnel: Funnel) => {
    setFunnelForm({
      name: funnel.name,
      slug: funnel.slug,
      description: funnel.description || "",
      emoji: funnel.emoji,
    });
    setEditingFunnelId(funnel.id);
    setIsEditingFunnel(true);
  };

  const startEditStage = (stage: any) => {
    setStageForm({ name: stage.name });
    setEditingStageId(stage.id);
    setIsEditingStage(true);
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gerenciar Funis</h2>
        <Button onClick={() => setIsCreatingFunnel(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Funil
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna 1: Lista de Funis */}
        <Card>
          <CardHeader>
            <CardTitle>Funis</CardTitle>
          </CardHeader>
          <CardContent>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFunnelDragEnd}>
              <SortableContext items={funnels.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {funnels.map((funnel) => (
                    <SortableItem key={funnel.id} id={funnel.id}>
                      <Button
                        variant={selectedFunnelId === funnel.id ? "default" : "outline"}
                        className="flex-1 justify-start"
                        onClick={() => setSelectedFunnelId(funnel.id)}
                      >
                        <span className="mr-2">{funnel.emoji}</span>
                        {funnel.name}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditFunnel(funnel)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setDeleteDialog({
                            open: true,
                            type: "funnel",
                            id: funnel.id,
                            name: funnel.name,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>

        {/* Coluna 2: Etapas do Funil Selecionado */}
        <Card>
          <CardHeader>
            <CardTitle>Etapas {selectedFunnel && `- ${selectedFunnel.emoji} ${selectedFunnel.name}`}</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedFunnelId ? (
              <p className="text-muted-foreground text-center py-8">Selecione um funil</p>
            ) : (
              <>
                <Button className="w-full mb-4" onClick={() => setIsCreatingStage(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Etapa
                </Button>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleStageDragEnd}>
                  <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {stages.map((stage) => (
                        <SortableItem key={stage.id} id={stage.id}>
                          <div className="flex-1 p-2 border rounded">{stage.name}</div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEditStage(stage)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                type: "stage",
                                id: stage.id,
                                name: stage.name,
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )}
          </CardContent>
        </Card>

        {/* Coluna 3: Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isCreatingFunnel || isEditingFunnel
                ? isCreatingFunnel
                  ? "Criar Funil"
                  : "Editar Funil"
                : isCreatingStage || isEditingStage
                ? isCreatingStage
                  ? "Criar Etapa"
                  : "Editar Etapa"
                : "Detalhes"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isCreatingFunnel || isEditingFunnel ? (
              <div className="space-y-4">
                <div>
                  <Label>Emoji</Label>
                  <Input
                    value={funnelForm.emoji}
                    onChange={(e) => setFunnelForm({ ...funnelForm, emoji: e.target.value })}
                    placeholder="📊"
                  />
                </div>
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={funnelForm.name}
                    onChange={(e) => setFunnelForm({ ...funnelForm, name: e.target.value })}
                    placeholder="Nome do funil"
                  />
                </div>
                <div>
                  <Label>Slug (identificador único)</Label>
                  <Input
                    value={funnelForm.slug}
                    onChange={(e) => setFunnelForm({ ...funnelForm, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    placeholder="slug-do-funil"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={funnelForm.description}
                    onChange={(e) => setFunnelForm({ ...funnelForm, description: e.target.value })}
                    placeholder="Descrição opcional"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={isCreatingFunnel ? handleCreateFunnel : handleUpdateFunnel} className="flex-1">
                    {isCreatingFunnel ? "Criar" : "Salvar"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreatingFunnel(false);
                      setIsEditingFunnel(false);
                      setEditingFunnelId(null);
                      setFunnelForm({ name: "", slug: "", description: "", emoji: "📊" });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : isCreatingStage || isEditingStage ? (
              <div className="space-y-4">
                <div>
                  <Label>Nome da Etapa</Label>
                  <Input
                    value={stageForm.name}
                    onChange={(e) => setStageForm({ name: e.target.value })}
                    placeholder="Nome da etapa"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={isCreatingStage ? handleCreateStage : handleUpdateStage} className="flex-1">
                    {isCreatingStage ? "Criar" : "Salvar"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreatingStage(false);
                      setIsEditingStage(false);
                      setEditingStageId(null);
                      setStageForm({ name: "" });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Selecione um funil ou clique em "Novo Funil" para começar
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar {deleteDialog.type === "funnel" ? "o funil" : "a etapa"} "{deleteDialog.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteDialog.type === "funnel" ? handleDeleteFunnel : handleDeleteStage}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
