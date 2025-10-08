import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonCompletionButtonProps {
  isCompleted: boolean;
  onComplete: () => Promise<void>;
  points: number;
}

export function LessonCompletionButton({ 
  isCompleted, 
  onComplete,
  points 
}: LessonCompletionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isCompleted || isLoading) return;
    
    setIsLoading(true);
    try {
      await onComplete();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isCompleted || isLoading}
      className={cn(
        "gap-2 transition-all duration-300",
        isCompleted 
          ? "border-green-500/30 bg-green-500/5 text-green-600 dark:text-green-400 hover:bg-green-500/5 cursor-default" 
          : "hover:border-primary/50 hover:bg-primary/5"
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
  );
}
