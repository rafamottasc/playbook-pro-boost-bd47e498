import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Module {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
}

interface ModuleCardProps {
  module: Module;
  lessonsCount: number;
  completedCount: number;
}

export function ModuleCard({ module, lessonsCount, completedCount }: ModuleCardProps) {
  const navigate = useNavigate();

  const progress = lessonsCount > 0 ? (completedCount / lessonsCount) * 100 : 0;
  const isCompleted = lessonsCount > 0 && completedCount === lessonsCount;

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        {module.cover_url ? (
          <img
            src={module.cover_url}
            alt={module.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <BookOpen className="h-16 w-16 text-primary/40" />
          </div>
        )}
        {/* Gradiente para melhor legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
        
        {isCompleted && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-500 text-white shadow-lg">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Concluído
            </Badge>
          </div>
        )}
        
        {/* Info na parte inferior da imagem */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-white text-lg mb-1 line-clamp-2 drop-shadow-lg">
            {module.title}
          </h3>
          {module.description && (
            <p className="text-white/90 text-sm line-clamp-2 drop-shadow-md">
              {module.description}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{lessonsCount} {lessonsCount === 1 ? 'aula' : 'aulas'}</span>
          </div>
        {lessonsCount > 0 && completedCount > 0 && (
          <span className="text-sm font-medium">
            {completedCount}/{lessonsCount}
          </span>
        )}
        </div>

        {lessonsCount > 0 && completedCount > 0 && (
          <Progress value={progress} className="h-2 mb-3" />
        )}

        <Button
          onClick={() => navigate(`/academy/modules/${module.id}`)}
          className="w-full"
          size="lg"
        >
          {completedCount > 0 ? 'Continuar' : 'Começar'}
        </Button>
      </div>
    </Card>
  );
}
