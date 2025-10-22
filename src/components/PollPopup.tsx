import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Lock } from "lucide-react";
import { usePolls } from "@/hooks/usePolls";
import { toast } from "sonner";

export function PollPopup() {
  const { activePoll, hasVoted, isVoting, vote, dismiss } = usePolls();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  // Abrir dialog quando houver enquete ativa
  useEffect(() => {
    if (activePoll && !hasVoted) {
      setIsOpen(true);
      setSelectedOptions([]);
    }
  }, [activePoll, hasVoted]);

  const handleSubmit = () => {
    if (selectedOptions.length === 0) {
      toast.error("Selecione uma opção", {
        description: "Você precisa selecionar ao menos uma opção para votar.",
      });
      return;
    }

    if (!activePoll) return;

    vote({
      poll_id: activePoll.id,
      option_ids: selectedOptions,
    });
  };

  const handleClose = () => {
    if (activePoll && !hasVoted) {
      dismiss(activePoll.id);
    }
    setIsOpen(false);
    setSelectedOptions([]);
  };

  // Não renderizar se não há enquete ativa
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
                          setSelectedOptions(
                            selectedOptions.filter((id) => id !== opt.id)
                          );
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
              disabled={isVoting || selectedOptions.length === 0}
              className="w-full"
            >
              {isVoting ? "Enviando..." : "Enviar voto"}
            </Button>

            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Os votos não são visíveis a outros corretores, apenas à
              administração.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <h3 className="font-semibold text-sm">Resultados:</h3>
            {activePoll.options.map((opt) => {
              const result = activePoll.results_cache?.[opt.id] || {
                votes: 0,
                percentage: 0,
              };
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
