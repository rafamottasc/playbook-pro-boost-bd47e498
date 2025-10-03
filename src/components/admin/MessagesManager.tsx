import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Copy, Plus, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface Message {
  id: string;
  title: string;
  content: string;
  funnel: string;
  stage: string;
  display_order: number;
  likes: number;
  dislikes: number;
}

const FUNNELS = [
  { id: "lead-novo", name: "Abordagem – Lead Novo" },
  { id: "atendimento", name: "Atendimento Geral" },
  { id: "repescagem", name: "Repescagem" },
  { id: "nutricao", name: "Nutrição" },
];

const STAGES_BY_FUNNEL: Record<string, string[]> = {
  "lead-novo": [
    "1ª Abordagem",
    "Sondagem",
    "Qualificação",
    "Apresentação",
    "Negociação",
    "Fechamento",
  ],
  atendimento: [
    "Recepção",
    "Identificação da Necessidade",
    "Solução",
    "Encerramento",
  ],
  repescagem: [
    "Recontato",
    "Reaquecimento",
    "Nova Proposta",
    "Fechamento",
  ],
  nutricao: [
    "Engajamento",
    "Educação",
    "Conversão",
  ],
};

function SortableMessageCard({
  message,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  message: Message;
  onEdit: (message: Message) => void;
  onDuplicate: (message: Message) => void;
  onDelete: (id: string) => void;
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
        <div
          {...attributes}
          {...listeners}
          className="cursor-move touch-none"
        >
          <GripVertical className="mt-1 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{message.title}</h3>
              <p className="text-sm text-muted-foreground">
                {FUNNELS.find((f) => f.id === message.funnel)?.name} - {message.stage}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(message)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDuplicate(message)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(message.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
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
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    funnel: "lead-novo",
    stage: "",
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
    if (selectedFunnel === "todos") {
      setFilteredMessages(messages);
    } else {
      setFilteredMessages(messages.filter(msg => msg.funnel === selectedFunnel));
    }
  }, [selectedFunnel, messages]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setMessages(data || []);
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
    try {
      if (editingMessage) {
        const { error } = await supabase
          .from("messages")
          .update({
            title: formData.title,
            content: formData.content,
            funnel: formData.funnel,
            stage: formData.stage,
          })
          .eq("id", editingMessage.id);

        if (error) throw error;
        toast({ title: "Mensagem atualizada com sucesso!" });
      } else {
        const { error } = await supabase.from("messages").insert([
          {
            title: formData.title,
            content: formData.content,
            funnel: formData.funnel,
            stage: formData.stage,
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
    if (!confirm("Tem certeza que deseja excluir esta mensagem?")) return;

    try {
      const { error } = await supabase.from("messages").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Mensagem excluída com sucesso!" });
      loadMessages();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir mensagem",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (message: Message) => {
    try {
      // Find the current message position
      const newDisplayOrder = message.display_order + 1;

      // Increment display_order for all messages after this one
      const messagesToUpdate = messages.filter(
        (m) => m.display_order >= newDisplayOrder
      );

      for (const msg of messagesToUpdate) {
        await supabase
          .from("messages")
          .update({ display_order: msg.display_order + 1 })
          .eq("id", msg.id);
      }

      // Insert the duplicate
      const { error } = await supabase.from("messages").insert([
        {
          title: `${message.title} (cópia)`,
          content: message.content,
          funnel: message.funnel,
          stage: message.stage,
          display_order: newDisplayOrder,
        },
      ]);

      if (error) throw error;
      toast({ title: "Mensagem duplicada com sucesso!" });
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
      funnel: message.funnel,
      stage: message.stage,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingMessage(null);
    setFormData({
      title: "",
      content: "",
      funnel: "lead-novo",
      stage: "",
    });
  };

  const availableStages = STAGES_BY_FUNNEL[formData.funnel] || [];

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-xl font-semibold">Mensagens do Playbook</h2>
        <div className="flex gap-2 items-center">
          <Select value={selectedFunnel} onValueChange={setSelectedFunnel}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filtrar por funil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Funis</SelectItem>
              {FUNNELS.map((funnel) => (
                <SelectItem key={funnel.id} value={funnel.id}>
                  {funnel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Mensagem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
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
                  value={formData.funnel}
                  onValueChange={(value) =>
                    setFormData({ ...formData, funnel: value, stage: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNNELS.map((funnel) => (
                      <SelectItem key={funnel.id} value={funnel.id}>
                        {funnel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stage">Etapa</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) =>
                    setFormData({ ...formData, stage: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
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
          </DialogContent>
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
              {filteredMessages.map((message) => (
                <SortableMessageCard
                  key={message.id}
                  message={message}
                  onEdit={openEditDialog}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
