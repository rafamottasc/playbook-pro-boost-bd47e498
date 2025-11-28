import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Lock,
  Monitor,
  Headset,
  Megaphone,
  Users,
  BookOpen,
  GraduationCap,
  UserCheck,
  Building,
  List,
  MessageSquare
} from "lucide-react";
import { useFeedbacks, FeedbackCategory } from "@/hooks/useFeedbacks";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryOptions = [
  { value: "system" as FeedbackCategory, label: "Sistema/Plataforma", icon: Monitor },
  { value: "service" as FeedbackCategory, label: "Atendimento", icon: Headset },
  { value: "campaigns" as FeedbackCategory, label: "Campanhas/Marketing", icon: Megaphone },
  { value: "leadership" as FeedbackCategory, label: "Liderança/Gestão", icon: Users },
  { value: "resources" as FeedbackCategory, label: "Recursos/Materiais", icon: BookOpen },
  { value: "academy" as FeedbackCategory, label: "Academy/Treinamentos", icon: GraduationCap },
  { value: "coworkers" as FeedbackCategory, label: "Colegas de Trabalho", icon: UserCheck },
  { value: "infrastructure" as FeedbackCategory, label: "Infraestrutura", icon: Building },
  { value: "other" as FeedbackCategory, label: "Outros", icon: List },
];

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategory>("system");
  const [message, setMessage] = useState("");
  const [includeTeam, setIncludeTeam] = useState(false);

  const { submitting, submitFeedback } = useFeedbacks();

  const handleSubmit = async () => {
    if (!message.trim() || message.length < 10) {
      return;
    }

    const result = await submitFeedback({
      type: "suggestion", // Tipo fixo - feedback unificado
      category,
      message,
      includeTeam,
    });

    if (result.success) {
      // Reset form
      setMessage("");
      setCategory("system");
      setIncludeTeam(false);
      onOpenChange(false);
    }
  };

  const selectedCategory = categoryOptions.find(opt => opt.value === category);
  const CategoryIcon = selectedCategory?.icon || List;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Enviar Feedback Anônimo
          </DialogTitle>
          <DialogDescription>
            Compartilhe suas ideias, elogios ou pontos de melhoria. 100% anônimo e confidencial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm">
              Categoria (opcional)
            </Label>
            <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>
              <SelectTrigger id="category">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="h-4 w-4" />
                    {selectedCategory?.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm">
              Mensagem
            </Label>
            <Textarea
              id="message"
              placeholder="Descreva sua sugestão, elogio ou observação..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={500}
              className="resize-none"
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/500 caracteres
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeTeam"
              checked={includeTeam}
              onCheckedChange={(checked) => setIncludeTeam(checked as boolean)}
            />
            <Label
              htmlFor="includeTeam"
              className="text-sm cursor-pointer leading-none"
            >
              Incluir meu departamento (opcional, para contexto)
            </Label>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !message.trim() || message.length < 10}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white gap-2"
          >
            <Lock className="h-4 w-4" />
            Enviar Anonimamente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
