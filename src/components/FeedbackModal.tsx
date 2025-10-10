import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  AlertTriangle, 
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
import { useFeedbacks, FeedbackType, FeedbackCategory } from "@/hooks/useFeedbacks";
import { cn } from "@/lib/utils";

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
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [category, setCategory] = useState<FeedbackCategory>("system");
  const [message, setMessage] = useState("");
  const [includeTeam, setIncludeTeam] = useState(false);

  const { submitting, submitFeedback } = useFeedbacks();

  const handleSubmit = async () => {
    if (!message.trim() || message.length < 10) {
      return;
    }

    const result = await submitFeedback({
      type,
      category,
      message,
      includeTeam,
    });

    if (result.success) {
      // Reset form
      setMessage("");
      setIncludeTeam(false);
      onOpenChange(false);
    }
  };

  const selectedCategory = categoryOptions.find(opt => opt.value === category);
  const CategoryIcon = selectedCategory?.icon || List;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <MessageSquare className="h-6 w-6 text-primary" />
            Enviar Feedback Anônimo
          </DialogTitle>
          <DialogDescription>
            <Badge variant="secondary" className="mt-2 gap-1">
              <Lock className="h-3 w-3" />
              100% Anônimo e Confidencial
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={type} onValueChange={(v) => setType(v as FeedbackType)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suggestion" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Sugestão
            </TabsTrigger>
            <TabsTrigger value="complaint" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Reclamação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestion" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Compartilhe suas ideias para melhorarmos a plataforma e o ambiente de trabalho.
            </p>
          </TabsContent>

          <TabsContent value="complaint" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Relate problemas ou situações que precisam de atenção. Sua identidade será totalmente protegida.
            </p>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
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
            <Label htmlFor="message">
              {type === "suggestion" ? "Sua Sugestão" : "Sua Reclamação"}
            </Label>
            <Textarea
              id="message"
              placeholder={
                type === "suggestion"
                  ? "Descreva sua sugestão de melhoria..."
                  : "Descreva o problema ou situação..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/500 caracteres
            </p>
          </div>

          <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
            <Checkbox
              id="includeTeam"
              checked={includeTeam}
              onCheckedChange={(checked) => setIncludeTeam(checked as boolean)}
            />
            <Label
              htmlFor="includeTeam"
              className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Incluir minha equipe (opcional, para contexto)
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !message.trim() || message.length < 10}
              className={cn(
                "flex-1 gap-2",
                type === "suggestion" ? "bg-primary" : "bg-orange-600 hover:bg-orange-700"
              )}
            >
              <Lock className="h-4 w-4" />
              Enviar Anonimamente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
