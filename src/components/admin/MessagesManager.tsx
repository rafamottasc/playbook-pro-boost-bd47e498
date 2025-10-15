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
    <Card ref={setNodeRef} style={style} className="p-4">
      <div className="flex items-start gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                {...attributes}
                {...listeners}
                className="cursor-move touch-none"
              >
                <GripVertical className="mt-1 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Arrastar para reordenar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{message.title}</h3>
                <Badge 
                  variant={
                    message.delivery_type === 'audio' ? 'default' :
                    message.delivery_type === 'call' ? 'destructive' :
                    'secondary'
                  }
                >
                  {message.delivery_type === 'audio' ? '🎤 Áudio' :
                   message.delivery_type === 'call' ? '📱 Ligação' :
                   '💬 Texto'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {funnelName} - {message.stage_name}
              </p>
            </div>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(message)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Editar mensagem</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDuplicate(message)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Duplicar mensagem</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(message.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Excluir mensagem</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <p className="mt-2 text-sm whitespace-pre-wrap">
            {message.content}
          </p>
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span>👍 {message.likes}</span>
            <span>👎 {message.dislikes}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function MessagesManager() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<string>("todos");
  const [selectedStage, setSelectedStage] = useState<string>("todas");
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const { funnels } = useFunnels();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    funnel_id: "",
    stage_name: "",
    delivery_type: "text" as 'audio' | 'call' | 'text',
  });
  const { stages } = useStages(selectedFunnel !== "todos" ? selectedFunnel : undefined);
  const { stages: formStages } = useStages(formData.funnel_id);

  const [oldFormData] = useState({
    title: "",
    content: "",
    funnel_id: "",
    stage_name: "",
    delivery_type: "text" as 'audio' | 'call' | 'text',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    let filtered = messages;
    
    if (selectedFunnel !== "todos") {
      // Convert UUID to slug for filtering
      const selectedFunnelObj = funnels.find(f => f.id === selectedFunnel);
      if (selectedFunnelObj) {
        filtered = filtered.filter(msg => msg.funnel_slug === selectedFunnelObj.slug);
      }
    }
    
    if (selectedStage !== "todas") {
      filtered = filtered.filter(msg => msg.stage_name === selectedStage);
    }
    
    setFilteredMessages(filtered);
  }, [selectedFunnel, selectedStage, messages, funnels]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar mensagens",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = filteredMessages.findIndex((msg) => msg.id === active.id);
    const newIndex = filteredMessages.findIndex((msg) => msg.id === over.id);

    const newOrder = arrayMove(filteredMessages, oldIndex, newIndex);
    setFilteredMessages(newOrder);

    // Update display_order in database
    try {
      const updates = newOrder.map((msg, index) => ({
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
      loadMessages();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar ordem",
        description: error.message,
        variant: "destructive",
      });
      loadMessages(); // Reload to restore correct order
    }
  };

  const handleSave = async () => {
    // Validação
    if (!formData.title.trim()) {
      toast({
        title: "Erro de validação",
        description: "O título é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.stage_name) {
      toast({
        title: "Erro de validação",
        description: "Selecione uma etapa",
        variant: "destructive",
      });
      return;
    }

    if (!formData.funnel_id) {
      toast({
        title: "Erro de validação",
        description: "Selecione um funil",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert funnel_id (UUID) to funnel_slug
      const selectedFunnelObj = funnels.find(f => f.id === formData.funnel_id);
      if (!selectedFunnelObj) {
        throw new Error("Funil não encontrado");
      }

      if (editingMessage) {
        const { error } = await supabase
          .from("messages")
          .update({
            title: formData.title,
            content: formData.content,
            funnel_slug: selectedFunnelObj.slug,
            stage_name: formData.stage_name,
            delivery_type: formData.delivery_type,
          })
          .eq("id", editingMessage.id);

        if (error) throw error;
        toast({ title: "Mensagem atualizada com sucesso!" });
      } else {
        const { error } = await supabase.from("messages").insert([
          {
            title: formData.title,
            content: formData.content,
            funnel_slug: selectedFunnelObj.slug,
            stage_name: formData.stage_name,
            delivery_type: formData.delivery_type,
            display_order: messages.length,
          },
        ]);

        if (error) throw error;
        toast({ title: "Mensagem criada com sucesso!" });
      }

      loadMessages();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar mensagem",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    setMessageToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!messageToDelete) return;

    try {
      const { error } = await supabase.from("messages").delete().eq("id", messageToDelete);
      if (error) throw error;

      toast({ title: "Mensagem excluída com sucesso!" });
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
      const newDisplayOrder = message.display_order + 1;

      // Get all messages in the same funnel that need to be shifted
      const { data: messagesToShift, error: fetchError } = await supabase
        .from("messages")
        .select("id, display_order")
        .eq("funnel_slug", message.funnel_slug)
        .gte("display_order", newDisplayOrder)
        .order("display_order", { ascending: false });

      if (fetchError) throw fetchError;

      // Shift messages in bulk using RPC or multiple updates
      if (messagesToShift && messagesToShift.length > 0) {
        const updates = messagesToShift.map(msg => 
          supabase
            .from("messages")
            .update({ display_order: msg.display_order + 1 })
            .eq("id", msg.id)
        );
        await Promise.all(updates);
      }

      // Insert duplicate
      const { error: insertError } = await supabase.from("messages").insert([
        {
          title: `${message.title} (cópia)`,
          content: message.content,
          funnel_slug: message.funnel_slug,
          stage_name: message.stage_name,
          delivery_type: message.delivery_type || 'text',
          display_order: newDisplayOrder,
        },
      ]);

      if (insertError) throw insertError;
      
      toast({ title: "Mensagem duplicada com sucesso!" });
      await loadMessages();
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
    // Convert funnel_slug to funnel_id (UUID)
    const funnelObj = funnels.find(f => f.slug === message.funnel_slug);
    setFormData({
      title: message.title,
      content: message.content,
      funnel_id: funnelObj?.id || "",
      stage_name: message.stage_name,
      delivery_type: message.delivery_type || 'text',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingMessage(null);
    setFormData({
      title: "",
      content: "",
      funnel_id: "",
      stage_name: "",
      delivery_type: "text",
    });
  };

  const handleFunnelChange = (value: string) => {
    setSelectedFunnel(value);
    setSelectedStage("todas");
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 mb-6">
        <h2 className="text-xl font-semibold">Mensagens do Playbook</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedFunnel} onValueChange={handleFunnelChange}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Filtrar por funil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Funis</SelectItem>
              {funnels.map((funnel) => (
                <SelectItem key={funnel.id} value={funnel.id}>
                  {funnel.emoji} {funnel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={selectedStage} 
            onValueChange={setSelectedStage}
            disabled={selectedFunnel === "todos"}
          >
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Filtrar por etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Etapas</SelectItem>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.name}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova Mensagem
            </Button>
          </DialogTrigger>
          <DraggableDialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMessage ? "Editar Mensagem" : "Nova Mensagem"}
              </DialogTitle>
              <DialogDescription>
                {editingMessage
                  ? "Edite os campos abaixo para atualizar a mensagem"
                  : "Preencha os campos para criar uma nova mensagem"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Saudação Inicial"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="funnel">Funil</Label>
                <Select
                  value={formData.funnel_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, funnel_id: value, stage_name: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funil" />
                  </SelectTrigger>
                  <SelectContent>
                    {funnels.map((funnel) => (
                      <SelectItem key={funnel.id} value={funnel.id}>
                        {funnel.emoji} {funnel.name}
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
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {formStages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.name}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_type">Tipo de Envio</Label>
                <Select
                  value={formData.delivery_type}
                  onValueChange={(value: 'audio' | 'call' | 'text') =>
                    setFormData({ ...formData, delivery_type: value })
                  }
                >
                  <SelectTrigger id="delivery_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">💬 Texto</SelectItem>
                    <SelectItem value="audio">🎤 Áudio</SelectItem>
                    <SelectItem value="call">📱 Ligação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo da Mensagem</Label>
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
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>Salvar</Button>
              </div>
            </div>
          </DraggableDialogContent>
        </Dialog>
        </div>
      </div>

      {filteredMessages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {selectedFunnel === "todos" 
              ? "Nenhuma mensagem cadastrada ainda" 
              : "Nenhuma mensagem encontrada neste funil"}
          </p>
        </div>
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
            <div className="grid gap-4">
              {filteredMessages.map((message) => {
                const funnel = funnels.find(f => f.slug === message.funnel_slug);
                return (
                  <SortableMessageCard
                    key={message.id}
                    message={message}
                    funnelName={funnel ? `${funnel.emoji} ${funnel.name}` : message.funnel_slug}
                    onEdit={openEditDialog}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                );
              })}
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
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
