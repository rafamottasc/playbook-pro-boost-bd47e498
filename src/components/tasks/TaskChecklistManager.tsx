import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChecklistItem } from "@/hooks/useTasks";

interface TaskChecklistManagerProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  readonly?: boolean;
}

export function TaskChecklistManager({ items, onChange, readonly = false }: TaskChecklistManagerProps) {
  const [newItemText, setNewItemText] = useState("");

  const handleAdd = () => {
    if (!newItemText.trim()) return;

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      task_id: '',
      text: newItemText.trim(),
      done: false,
      display_order: items.length,
    };

    onChange([...items, newItem]);
    setNewItemText("");
  };

  const handleRemove = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const handleToggle = (id: string) => {
    onChange(items.map(item => 
      item.id === id ? { ...item, done: !item.done } : item
    ));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      {/* Lista de itens */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2 bg-muted rounded">
              <Checkbox
                checked={item.done}
                onCheckedChange={() => handleToggle(item.id)}
                disabled={readonly}
              />
              <span className={cn(
                "flex-1 text-sm",
                item.done && "line-through opacity-60"
              )}>
                {item.text}
              </span>
              {!readonly && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemove(item.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input para adicionar novo item */}
      {!readonly && (
        <div className="flex gap-2">
          <Input
            placeholder="Adicione um item ao checklist..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!newItemText.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {items.length === 0 && readonly && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum item no checklist
        </p>
      )}
    </div>
  );
}
