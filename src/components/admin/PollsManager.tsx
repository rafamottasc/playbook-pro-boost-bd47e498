import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, BarChart3, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { PollMetrics } from "./PollMetrics";

interface Poll {
  id: string;
  title: string;
  description: string | null;
  allow_multiple: boolean;
  target_audience: string;
  start_date: string;
  end_date: string;
  active: boolean;
  results_cache: any;
  created_by: string | null;
  profiles?: {
    full_name: string;
  } | null;
}

interface PollOption {
  id?: string;
  option_text: string;
  display_order: number;
}

export function PollsManager() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pollToDelete, setPollToDelete] = useState<Poll | null>(null);
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [targetAudience, setTargetAudience] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [options, setOptions] = useState<PollOption[]>([
    { option_text: "", display_order: 0 },
    { option_text: "", display_order: 1 },
  ]);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    const { data, error } = await supabase
      .from("polls")
      .select(`
        *,
        profiles!polls_created_by_fkey(full_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar enquetes:", error);
      return;
    }

    setPolls(data || []);
  };

  const getPollStatus = (poll: Poll) => {
    if (!poll.active) return { label: "Inativa", color: "secondary" };
    const now = new Date();
    const start = new Date(poll.start_date);
    const end = new Date(poll.end_date);
    
    if (now < start) return { label: "Agendada", color: "default" };
    if (now > end) return { label: "Encerrada", color: "destructive" };
    return { label: "Ativa", color: "default" };
  };

  const handleOpenDialog = (poll?: Poll) => {
    if (poll) {
      setSelectedPoll(poll);
      setTitle(poll.title);
      setDescription(poll.description || "");
      setAllowMultiple(poll.allow_multiple);
      setTargetAudience(poll.target_audience);
      setStartDate(format(new Date(poll.start_date), "yyyy-MM-dd'T'HH:mm"));
      setEndDate(format(new Date(poll.end_date), "yyyy-MM-dd'T'HH:mm"));
      // Load options
      fetchPollOptions(poll.id);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const fetchPollOptions = async (pollId: string) => {
    const { data } = await supabase
      .from("poll_options")
      .select("*")
      .eq("poll_id", pollId)
      .order("display_order");

    if (data) {
      setOptions(data);
    }
  };

  const resetForm = () => {
    setSelectedPoll(null);
    setTitle("");
    setDescription("");
    setAllowMultiple(false);
    setTargetAudience("all");
    setStartDate("");
    setEndDate("");
    setOptions([
      { option_text: "", display_order: 0 },
      { option_text: "", display_order: 1 },
    ]);
  };

  const handleAddOption = () => {
    setOptions([...options, { option_text: "", display_order: options.length }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast({
        title: "Erro",
        description: "É necessário ter no mínimo 2 opções.",
        variant: "destructive",
      });
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].option_text = value;
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    // Validações
    if (!title.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Datas de início e fim são obrigatórias.",
        variant: "destructive",
      });
      return;
    }

    const validOptions = options.filter(opt => opt.option_text.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Erro",
        description: "É necessário ter no mínimo 2 opções preenchidas.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Converter datetime-local para ISO mantendo o timezone local (sem converter para UTC)
      const startLocal = new Date(startDate);
      const endLocal = new Date(endDate);
      
      const pollData = {
        title: title.trim(),
        description: description.trim() || null,
        allow_multiple: allowMultiple,
        target_audience: targetAudience,
        start_date: new Date(startLocal.getTime() - startLocal.getTimezoneOffset() * 60000).toISOString(),
        end_date: new Date(endLocal.getTime() - endLocal.getTimezoneOffset() * 60000).toISOString(),
        active: true,
        created_by: user.id,
      };

      if (selectedPoll) {
        // Atualizar enquete
        const { error: updateError } = await supabase
          .from("polls")
          .update(pollData)
          .eq("id", selectedPoll.id);

        if (updateError) throw updateError;

        // Deletar opções antigas
        await supabase
          .from("poll_options")
          .delete()
          .eq("poll_id", selectedPoll.id);

        // Inserir novas opções
        const optionsData = validOptions.map((opt, idx) => ({
          poll_id: selectedPoll.id,
          option_text: opt.option_text.trim(),
          display_order: idx,
        }));

        const { error: optionsError } = await supabase
          .from("poll_options")
          .insert(optionsData);

        if (optionsError) throw optionsError;

        toast({
          title: "Sucesso!",
          description: "Enquete atualizada com sucesso.",
        });
      } else {
        // Criar nova enquete
        const { data: newPoll, error: pollError } = await supabase
          .from("polls")
          .insert(pollData)
          .select()
          .single();

        if (pollError) throw pollError;

        // Inserir opções
        const optionsData = validOptions.map((opt, idx) => ({
          poll_id: newPoll.id,
          option_text: opt.option_text.trim(),
          display_order: idx,
        }));

        const { error: optionsError } = await supabase
          .from("poll_options")
          .insert(optionsData);

        if (optionsError) throw optionsError;

        toast({
          title: "Sucesso!",
          description: "Enquete criada com sucesso.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPolls();
    } catch (error: any) {
      console.error("Erro ao salvar enquete:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (poll: Poll) => {
    const { error } = await supabase
      .from("polls")
      .update({ active: !poll.active })
      .eq("id", poll.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar status da enquete.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Status atualizado",
      description: `Enquete ${!poll.active ? "ativada" : "desativada"} com sucesso.`,
    });
    fetchPolls();
  };

  const handleDelete = (poll: Poll) => {
    setPollToDelete(poll);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pollToDelete) return;

    const { error } = await supabase
      .from("polls")
      .delete()
      .eq("id", pollToDelete.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a enquete.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Enquete excluída",
      description: "A enquete foi removida com sucesso.",
    });

    setDeleteConfirmOpen(false);
    setPollToDelete(null);
    fetchPolls();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Enquetes</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Enquete
        </Button>
      </div>

      <div className="space-y-4">
        {polls.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma enquete criada ainda.
          </div>
        ) : (
          polls.map((poll) => {
            const status = getPollStatus(poll);
            return (
              <div
                key={poll.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-semibold">{poll.title}</h3>
                    {poll.description && (
                      <p className="text-sm text-muted-foreground">{poll.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Criado por: {poll.profiles?.full_name || "Sistema"}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={status.color as any}>{status.label}</Badge>
                      <Badge variant="outline">
                        {poll.target_audience === 'all' ? 'Todos' : poll.target_audience.replace('team:', 'Equipe: ')}
                      </Badge>
                      <Badge variant="outline">
                        {poll.allow_multiple ? 'Múltiplas respostas' : 'Resposta única'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedPoll(poll);
                        setIsMetricsOpen(true);
                      }}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(poll)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(poll)}
                    >
                      {poll.active ? "❌" : "✅"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(poll)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(poll.start_date), "dd/MM/yyyy HH:mm")} até{" "}
                  {format(new Date(poll.end_date), "dd/MM/yyyy HH:mm")}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPoll ? "Editar Enquete" : "Nova Enquete"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Qual tema você gostaria no próximo treinamento?"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Informações adicionais sobre a enquete..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Data Início *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end_date">Data Fim *</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="target_audience">Público-alvo</Label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="team:Águia">Equipe Águia</SelectItem>
                  <SelectItem value="team:Leão">Equipe Leão</SelectItem>
                  <SelectItem value="team:Tubarão">Equipe Tubarão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="allow_multiple"
                checked={allowMultiple}
                onCheckedChange={setAllowMultiple}
              />
              <Label htmlFor="allow_multiple">Permitir múltiplas respostas</Label>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Opções * (mínimo 2)</Label>
                <Button variant="outline" size="sm" onClick={handleAddOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option.option_text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Opção ${index + 1}`}
                  />
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedPoll && (
        <PollMetrics
          poll={selectedPoll}
          isOpen={isMetricsOpen}
          onClose={() => {
            setIsMetricsOpen(false);
            setSelectedPoll(null);
          }}
        />
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a enquete "{pollToDelete?.title}"? Esta ação não pode ser desfeita.
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
