import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Copy, Plus, GripVertical } from "lucide-react";
import {
  Dialog,
  DraggableDialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useFunnels } from "@/hooks/useFunnels";
import { useStages } from "@/hooks/useStages";

interface Message {
  id: string;
  title: string;
  content: string;
  funnel_slug: string;
  stage_name: string;
  display_order: number;
  likes: number;
  dislikes: number;
  delivery_type?: 'audio' | 'call' | 'text';
}

function SortableMessageCard({
  message,
  onEdit,
  onDuplicate,
  onDelete,
  funnelName,
}: {
  message: Message;
  onEdit: (message: Message) => void;
  onDuplicate: (message: Message) => void;
  onDelete: (id: string) => void;
  funnelName: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: message.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="touch-none"
    >
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <button
            className="cursor-grab active:cursor-grabbing mt-1 p-1 hover:bg-muted rounded"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-1">{message.title}</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">{funnelName}</Badge>
                  <Badge variant="secondary">{message.stage_name}</Badge>
                  {message.delivery_type && (
                    <Badge variant={`delivery-${message.delivery_type}` as any} className="capitalize">
                      {message.delivery_type === 'audio' ? '🎵 Áudio' : 
                       message.delivery_type === 'call' ? '📞 Ligação' : 
                       '💬 Texto'}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(message)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDuplicate(message)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Duplicar</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(message.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Excluir</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3 mb-2">
              {message.content}
            </p>

            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>👍 {message.likes || 0}</span>
              <span>👎 {message.dislikes || 0}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function MessagesContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [filterFunnel, setFilterFunnel] = useState<string>("all");
  const [filterStage, setFilterStage] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    funnel_slug: "",
    stage_name: "",
    delivery_type: "text" as 'audio' | 'call' | 'text',
  });

  const { toast } = useToast();
  const { funnels, loading: funnelsLoading } = useFunnels();
  const { stages, loading: stagesLoading } = useStages(formData.funnel_slug);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      const typedData = (data || []).map(msg => ({
        ...msg,
        delivery_type: (msg.delivery_type || 'text') as 'audio' | 'call' | 'text'
      }));
      setMessages(typedData);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar mensagens",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = messages.findIndex((m) => m.id === active.id);
      const newIndex = messages.findIndex((m) => m.id === over.id);

      const newMessages = arrayMove(messages, oldIndex, newIndex);
      setMessages(newMessages);

      try {
        const updates = newMessages.map((msg, index) => ({
          id: msg.id,
          display_order: index,
        }));

        for (const update of updates) {
          await supabase
            .from("messages")
            .update({ display_order: update.display_order })
            .eq("id", update.id);
        }

        toast({ title: "Ordem atualizada com sucesso!" });
      } catch (error: any) {
        toast({
          title: "Erro ao atualizar ordem",
          description: error.message,
          variant: "destructive",
        });
        loadMessages();
      }
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content || !formData.funnel_slug || !formData.stage_name) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingMessage) {
        const { error } = await supabase
          .from("messages")
          .update({
            title: formData.title,
            content: formData.content,
            funnel_slug: formData.funnel_slug,
            stage_name: formData.stage_name,
            delivery_type: formData.delivery_type,
          })
          .eq("id", editingMessage.id);

        if (error) throw error;
        toast({ title: "Mensagem atualizada!" });
      } else {
        const maxOrder = messages.length > 0 
          ? Math.max(...messages.map(m => m.display_order)) 
          : -1;

        const { error } = await supabase.from("messages").insert({
          title: formData.title,
          content: formData.content,
          funnel_slug: formData.funnel_slug,
          stage_name: formData.stage_name,
          delivery_type: formData.delivery_type,
          display_order: maxOrder + 1,
          likes: 0,
          dislikes: 0,
        });

        if (error) throw error;
        toast({ title: "Mensagem criada!" });
      }

      loadMessages();
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar mensagem",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    setMessageToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!messageToDelete) return;

    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageToDelete);

      if (error) throw error;
      toast({ title: "Mensagem excluída!" });
      loadMessages();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir mensagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setMessageToDelete(null);
    }
  };

  const handleDuplicate = async (message: Message) => {
    try {
      const maxOrder = messages.length > 0 
        ? Math.max(...messages.map(m => m.display_order)) 
        : -1;

      const { error } = await supabase.from("messages").insert({
        title: `${message.title} (cópia)`,
        content: message.content,
        funnel_slug: message.funnel_slug,
        stage_name: message.stage_name,
        delivery_type: message.delivery_type,
        display_order: maxOrder + 1,
        likes: 0,
        dislikes: 0,
      });

      if (error) throw error;
      toast({ title: "Mensagem duplicada!" });
      loadMessages();
    } catch (error: any) {
      toast({
        title: "Erro ao duplicar mensagem",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (message: Message) => {
    setEditingMessage(message);
    setFormData({
      title: message.title,
      content: message.content,
      funnel_slug: message.funnel_slug,
      stage_name: message.stage_name,
      delivery_type: message.delivery_type || 'text',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingMessage(null);
    setFormData({
      title: "",
      content: "",
      funnel_slug: "",
      stage_name: "",
      delivery_type: "text",
    });
  };

  const filteredMessages = messages.filter((message) => {
    if (filterFunnel !== "all" && message.funnel_slug !== filterFunnel) return false;
    if (filterStage !== "all" && message.stage_name !== filterStage) return false;
    return true;
  });

  const availableStages = filterFunnel !== "all" && stages.length > 0
    ? stages
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mensagens do Playbook</h2>
          <p className="text-sm text-muted-foreground">
            {filteredMessages.length} mensagen{filteredMessages.length !== 1 ? 's' : 's'}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova Mensagem
            </Button>
          </DialogTrigger>
          <DraggableDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMessage ? "Editar Mensagem" : "Nova Mensagem"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da mensagem do playbook
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Primeira abordagem"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="funnel">Funil</Label>
                <Select
                  value={formData.funnel_slug}
                  onValueChange={(value) => {
                    setFormData({ ...formData, funnel_slug: value, stage_name: "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funil" />
                  </SelectTrigger>
                  <SelectContent>
                    {funnels.map((funnel) => (
                      <SelectItem key={funnel.slug} value={funnel.slug}>
                        {funnel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Etapa</Label>
                <Select
                  value={formData.stage_name}
                  onValueChange={(value) =>
                    setFormData({ ...formData, stage_name: value })
                  }
                  disabled={!formData.funnel_slug}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.name} value={stage.name}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_type">Tipo de Entrega</Label>
                <Select
                  value={formData.delivery_type}
                  onValueChange={(value: 'audio' | 'call' | 'text') =>
                    setFormData({ ...formData, delivery_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">💬 Texto</SelectItem>
                    <SelectItem value="audio">🎵 Áudio</SelectItem>
                    <SelectItem value="call">📞 Ligação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Digite o conteúdo da mensagem..."
                  rows={8}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {editingMessage ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </div>
          </DraggableDialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="space-y-2 flex-1">
          <Label>Filtrar por Funil</Label>
          <Select value={filterFunnel} onValueChange={(value) => {
            setFilterFunnel(value);
            setFilterStage("all");
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os funis</SelectItem>
              {funnels.map((funnel) => (
                <SelectItem key={funnel.slug} value={funnel.slug}>
                  {funnel.name}
                </SelectItem>
              ))}</SelectContent>
          </Select>
        </div>

        <div className="space-y-2 flex-1">
          <Label>Filtrar por Etapa</Label>
          <Select 
            value={filterStage} 
            onValueChange={setFilterStage}
            disabled={filterFunnel === "all"}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as etapas</SelectItem>
              {availableStages.map((stage: any) => (
                <SelectItem key={stage.name} value={stage.name}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredMessages.length === 0 ? (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="text-4xl">📝</div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Nenhuma mensagem encontrada</h3>
              <p className="text-muted-foreground text-sm">
                {messages.length === 0
                  ? "Comece criando sua primeira mensagem do playbook"
                  : "Nenhuma mensagem corresponde aos filtros selecionados"}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredMessages.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {filteredMessages.map((message) => (
                <SortableMessageCard
                  key={message.id}
                  message={message}
                  onEdit={openEditDialog}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  funnelName={funnels.find(f => f.slug === message.funnel_slug)?.name || message.funnel_slug}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
