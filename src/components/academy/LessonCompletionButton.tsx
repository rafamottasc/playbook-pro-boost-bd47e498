import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonCompletionButtonProps {
  isCompleted: boolean;
  onComplete: () => Promise<void>;
  onUncomplete: () => Promise<void>;
  points: number;
  videoProgress: number;
  disabled?: boolean;
}

export function LessonCompletionButton({ 
  isCompleted, 
  onComplete,
  onUncomplete,
  points,
  videoProgress,
  disabled = false
}: LessonCompletionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const canComplete = videoProgress >= 50;

  const handleClick = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (isCompleted) {
        await onUncomplete();
      } else {
        await onComplete();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={(!canComplete && !isCompleted) || isLoading || disabled}
        className={cn(
          "gap-2 transition-all duration-300 w-full",
          isCompleted 
            ? "border-green-500/30 bg-green-500/5 text-green-600 dark:text-green-400 hover:bg-green-500/10 cursor-pointer" 
            : canComplete
            ? "hover:border-primary/50 hover:bg-primary/5"
            : "opacity-50 cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Salvando...</span>
          </>
        ) : isCompleted ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Aula Concluída</span>
            <span className="text-xs opacity-70">+{points} pts</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs">Marcar como Concluída</span>
          </>
        )}
      </Button>
      {!canComplete && !isCompleted && (
        <p className="text-xs text-muted-foreground text-center">
          Assista pelo menos 50% do vídeo ({videoProgress}% assistido)
        </p>
      )}
      {isCompleted && (
        <p className="text-xs text-muted-foreground text-center">
          Clique novamente para desmarcar
        </p>
      )}
    </div>
  );
}
