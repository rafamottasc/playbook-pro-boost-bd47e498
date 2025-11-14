import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateStatusButtonProps {
  onCreateStatus: (name: string) => void;
  canCreate: boolean;
  maxStatuses: number;
  currentCount: number;
}

export function CreateStatusButton({
  onCreateStatus,
  canCreate,
  maxStatuses,
  currentCount,
}: CreateStatusButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (name.trim()) {
      onCreateStatus(name.trim());
      setName('');
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      setName('');
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setIsCreating(false);
  };

  if (!isCreating) {
    return (
      <div className="min-w-[280px] max-w-[280px]">
        <Button
          variant="ghost"
          onClick={() => setIsCreating(true)}
          disabled={!canCreate}
          className="w-full justify-start bg-muted/30 hover:bg-muted/50 h-auto py-3 px-4 rounded-lg border-2 border-dashed border-border/50 hover:border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={!canCreate ? `Limite de ${maxStatuses} etapas atingido` : 'Adicionar nova etapa'}
        >
          <Plus className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">
            Adicionar outra lista
          </span>
        </Button>
        {!canCreate && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Limite: {currentCount}/{maxStatuses} etapas
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="min-w-[280px] max-w-[280px] bg-muted rounded-lg p-3 space-y-2">
      <Input
        placeholder="Nome da etapa..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-9"
        autoFocus
        maxLength={30}
      />
      <div className="flex gap-2">
        <Button 
          size="sm" 
          onClick={handleCreate}
          disabled={!name.trim()}
          className="flex-1"
        >
          Adicionar lista
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={handleCancel}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
