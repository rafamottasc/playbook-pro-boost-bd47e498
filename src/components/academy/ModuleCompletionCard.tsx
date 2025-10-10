import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronRight, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ModuleCompletionCardProps {
  moduleTitle: string;
  totalPoints: number;
  nextModule: { id: string; title: string } | null;
  onViewModules: () => void;
}

export function ModuleCompletionCard({ 
  moduleTitle, 
  totalPoints, 
  nextModule,
  onViewModules 
}: ModuleCompletionCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border-primary/20">
      <div className="text-center space-y-4">
        {/* Trophy Icon */}
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10 animate-scale-in">
            <Trophy className="h-12 w-12 text-primary" />
          </div>
        </div>

        {/* Congratulations */}
        <div>
          <h3 className="text-2xl font-bold mb-2">🎉 Parabéns!</h3>
          <p className="text-muted-foreground">
            Você completou o módulo <span className="font-semibold text-foreground">{moduleTitle}</span>
          </p>
        </div>

        {/* Points Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="px-4 py-2 text-lg">
            +{totalPoints} pontos ganhos
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-4">
          {nextModule ? (
            <>
              <Button
                onClick={() => navigate(`/academy/modules/${nextModule.id}`)}
                className="w-full"
                size="lg"
              >
                Próximo módulo: {nextModule.title}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={onViewModules}
                className="w-full"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Ver todos os módulos
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <Badge variant="secondary" className="w-full py-2">
                ✨ Você completou todos os módulos disponíveis!
              </Badge>
              <Button
                variant="outline"
                onClick={onViewModules}
                className="w-full"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Voltar para módulos
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
