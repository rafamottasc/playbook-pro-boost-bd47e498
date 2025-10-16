import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GraduationCap, Play, MessageCircle } from "lucide-react";

interface AcademyOnboardingProps {
  onClose: () => void;
}

export function AcademyOnboarding({ onClose }: AcademyOnboardingProps) {
  const [step, setStep] = useState(1);

  const steps = [
    {
      icon: <GraduationCap className="h-12 w-12 text-primary" />,
      title: "Escolha um módulo",
      description: "Navegue pelos módulos disponíveis e escolha o que mais te interessa para começar sua jornada de aprendizado."
    },
    {
      icon: <Play className="h-12 w-12 text-primary" />,
      title: "Assista às aulas",
      description: "Cada aula possui conteúdo em vídeo e materiais complementares. Seu progresso é salvo automaticamente."
    },
    {
      icon: <MessageCircle className="h-12 w-12 text-primary" />,
      title: "Envie suas dúvidas",
      description: "Tem alguma dúvida? Envie suas perguntas abaixo de cada aula e nossa equipe responderá em breve."
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Bem-vindo aos Treinamentos Gerais! 🎓
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6 text-center">
          <div className="flex justify-center mb-6">
            {currentStep.icon}
          </div>
          <h3 className="text-xl font-semibold mb-3">
            {currentStep.title}
          </h3>
          <p className="text-muted-foreground">
            {currentStep.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index + 1 === step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            {step < steps.length ? (
              <>
                <Button variant="ghost" onClick={onClose}>
                  Pular
                </Button>
                <Button onClick={() => setStep(step + 1)}>
                  Próximo
                </Button>
              </>
            ) : (
              <Button onClick={onClose}>
                Começar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
