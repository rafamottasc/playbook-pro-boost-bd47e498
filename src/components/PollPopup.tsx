import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Lock } from "lucide-react";

interface PollOption {
  id: string;
  option_text: string;
  display_order: number;
}

interface Poll {
  id: string;
  title: string;
  description: string | null;
  allow_multiple: boolean;
  results_cache: any;
  options: PollOption[];
}

export function PollPopup() {
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchActivePoll();
  }, []);

  const fetchActivePoll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar enquetes ativas
      // Usar hora local do Brasil (sem conversão para UTC)
      const now = new Date();
      const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();
      
      const { data: polls, error: pollError } = await supabase
        .from("polls")
        .select(`
          id,
          title,
          description,
          allow_multiple,
          results_cache,
          options:poll_options(
            id,
            option_text,
            display_order
          )
        `)
        .eq("active", true)
        .gte("end_date", localNow)
        .lte("start_date", localNow)
        .order("created_at", { ascending: false });

      if (pollError) throw pollError;
      if (!polls || polls.length === 0) return;

      // Filtrar enquetes não votadas e não visualizadas
      for (const poll of polls) {
        // Verificar se já votou
        const { data: vote } = await supabase
          .from("poll_responses")
          .select("option_id")
          .eq("poll_id", poll.id)
          .eq("user_id", user.id);

        // Verificar se já visualizou/interagiu com a enquete
        const { data: view } = await supabase
          .from("poll_views")
          .select("id")
          .eq("poll_id", poll.id)
          .eq("user_id", user.id);

        // Só mostrar se NÃO votou E NÃO visualizou
        if ((!vote || vote.length === 0) && (!view || view.length === 0)) {
          // Ordenar opções
          poll.options.sort((a: PollOption, b: PollOption) => a.display_order - b.display_order);

          setActivePoll(poll as Poll);
          setHasVoted(false);
          setIsOpen(true);

          break; // Mostrar apenas 1 enquete por vez
        }
      }
    } catch (error) {
      console.error("Erro ao buscar enquete:", error);
    }
  };

  const handleSubmit = async () => {
    if (selectedOptions.length === 0) {
      toast({
        title: "Selecione uma opção",
        description: "Você precisa selecionar ao menos uma opção para votar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activePoll) return;

      const responses = selectedOptions.map(optionId => ({
        poll_id: activePoll.id,
        user_id: user.id,
        option_id: optionId,
      }));

      const { error } = await supabase
        .from("poll_responses")
        .insert(responses);

      if (error) throw error;

      // Registrar visualização (usar upsert para evitar erros de duplicação)
      await supabase
        .from("poll_views")
        .upsert(
          { poll_id: activePoll.id, user_id: user.id },
          { onConflict: 'poll_id,user_id', ignoreDuplicates: true }
        );

      // Atualizar estado
      setHasVoted(true);

      // Buscar resultados atualizados
      const { data: updatedPoll } = await supabase
        .from("polls")
        .select("results_cache")
        .eq("id", activePoll.id)
        .single();

      if (updatedPoll) {
        setActivePoll({ ...activePoll, results_cache: updatedPoll.results_cache });
      }

      toast({
        title: "Voto registrado!",
        description: "Obrigado pela sua participação.",
      });
    } catch (error: any) {
      console.error("Erro ao enviar voto:", error);
      
      // Se o erro for de voto duplicado, registrar visualização mesmo assim
      // para evitar que a enquete reapareça
      if (error.message?.includes("já votou") || error.code === "23505") {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && activePoll) {
          await supabase
            .from("poll_views")
            .upsert(
              { poll_id: activePoll.id, user_id: user.id },
              { onConflict: 'poll_id,user_id', ignoreDuplicates: true }
            );
          
          setHasVoted(true);
        }
      }
      
      toast({
        title: "Erro ao votar",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setActivePoll(null);
    setSelectedOptions([]);
    setHasVoted(false);
  };

  if (!activePoll) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {activePoll.title}
          </DialogTitle>
          {activePoll.description && (
            <DialogDescription>{activePoll.description}</DialogDescription>
          )}
        </DialogHeader>

        {!hasVoted ? (
          <div className="space-y-4 mt-4">
            {activePoll.allow_multiple ? (
              <div className="space-y-3">
                {activePoll.options.map((opt) => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={opt.id}
                      checked={selectedOptions.includes(opt.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedOptions([...selectedOptions, opt.id]);
                        } else {
                          setSelectedOptions(selectedOptions.filter(id => id !== opt.id));
                        }
                      }}
                    />
                    <Label htmlFor={opt.id} className="cursor-pointer flex-1">
                      {opt.option_text}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <RadioGroup
                value={selectedOptions[0] || ""}
                onValueChange={(val) => setSelectedOptions([val])}
              >
                {activePoll.options.map((opt) => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.id} id={opt.id} />
                    <Label htmlFor={opt.id} className="cursor-pointer flex-1">
                      {opt.option_text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedOptions.length === 0}
              className="w-full"
            >
              {isSubmitting ? "Enviando..." : "Enviar voto"}
            </Button>

            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Os votos não são visíveis a outros corretores, apenas à administração.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <h3 className="font-semibold text-sm">Resultados:</h3>
            {activePoll.options.map((opt) => {
              const result = activePoll.results_cache?.[opt.id] || { votes: 0, percentage: 0 };
              return (
                <div key={opt.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{opt.option_text}</span>
                    <span className="font-semibold">{result.percentage}%</span>
                  </div>
                  <Progress value={result.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {result.votes} {result.votes === 1 ? "voto" : "votos"}
                  </p>
                </div>
              );
            })}

            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-4">
              <Lock className="h-4 w-4" />
              Seu voto foi registrado de forma confidencial.
            </p>

            <Button onClick={handleClose} variant="outline" className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
