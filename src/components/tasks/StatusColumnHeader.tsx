import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TaskStatus } from "@/hooks/useTaskStatuses";

interface StatusColumnHeaderProps {
  status: TaskStatus;
  taskCount: number;
  onEditName: (newName: string) => void;
  onEditColor: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function StatusColumnHeader({
  status,
  taskCount,
  onEditName,
  onEditColor,
  onDelete,
  canDelete,
}: StatusColumnHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(status.name);

  const handleSave = () => {
    if (name.trim() && name !== status.name) {
      onEditName(name.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setName(status.name);
      setIsEditing(false);
    }
  };

  return (
    <div 
      className="flex items-center justify-between px-3 py-2.5 border-b"
      style={{ 
        backgroundColor: `${status.color}10`,
        borderTopColor: status.color,
        borderTopWidth: '3px',
      }}
    >
      {isEditing ? (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm font-semibold"
          autoFocus
          maxLength={30}
        />
      ) : (
        <div 
          className="flex items-center gap-2 flex-1 cursor-pointer hover:bg-muted/30 px-2 py-1 rounded transition-colors"
          onClick={() => setIsEditing(true)}
          title="Clique para editar"
        >
          <span className="font-semibold text-sm text-foreground">
            {status.name}
          </span>
          <Badge variant="secondary" className="text-xs">
            {taskCount}
          </Badge>
        </div>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-7 w-7 ml-1"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            Editar nome
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEditColor}>
            Mudar cor
          </DropdownMenuItem>
          {canDelete && (
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              Excluir etapa
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
