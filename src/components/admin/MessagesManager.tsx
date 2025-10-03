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

export function MessagesManager() {
  const [messages, setMessages] = useState<Message[]>([]);
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

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("funnel")
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
      const { error } = await supabase.from("messages").insert([
        {
          title: `${message.title} (cópia)`,
          content: message.content,
          funnel: message.funnel,
          stage: message.stage,
          display_order: messages.length,
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

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Mensagens do Playbook</h2>
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
                    setFormData({ ...formData, funnel: value })
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
                <Input
                  id="stage"
                  value={formData.stage}
                  onChange={(e) =>
                    setFormData({ ...formData, stage: e.target.value })
                  }
                  placeholder="Ex: 1ª Abordagem, Sondagem, etc"
                />
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

      <div className="grid gap-4">
        {messages.map((message) => (
          <Card key={message.id} className="p-4">
            <div className="flex items-start gap-4">
              <GripVertical className="mt-1 text-muted-foreground cursor-move" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{message.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {message.funnel} - {message.stage}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(message)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicate(message)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(message.id)}
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
        ))}
      </div>
    </div>
  );
}
