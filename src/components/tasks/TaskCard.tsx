import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp, Clock, MoreVertical, Edit, Copy, Clock3, MoveRight, Trash2, Paperclip, User, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryBadge } from "./CategoryBadge";
import { PriorityBadge } from "./PriorityBadge";
import type { DailyTask } from "@/hooks/useTasks";

interface TaskCardProps {
  task: DailyTask;
  onToggle: (taskId: string, currentDone: boolean) => void;
  onEdit: (task: DailyTask) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onPostpone: (taskId: string) => void;
  onMove: (taskId: string, period: 'manha' | 'tarde' | 'noite') => void;
  checklistProgress?: { completed: number; total: number };
}

export function TaskCard({ 
  task, 
  onToggle, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onPostpone, 
  onMove,
  checklistProgress 
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = task.notes || (checklistProgress && checklistProgress.total > 0) || 
                     (task.contacts && task.contacts.length > 0) || 
                     (task.attachments && task.attachments.length > 0);

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      task.done && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={task.done}
            onCheckedChange={() => onToggle(task.id, task.done)}
            className="mt-1"
          />

          {/* Conteúdo Principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 
                className={cn(
                  "font-medium text-sm cursor-pointer hover:text-primary transition-colors",
                  task.done && "line-through text-muted-foreground"
                )}
                onClick={() => onEdit(task)}
              >
                {task.title}
              </h3>

              {/* Menu de Ações */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(task.id)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPostpone(task.id)}>
                    <Clock3 className="w-4 h-4 mr-2" />
                    Adiar +1h
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onMove(task.id, 'manha')}>
                    <MoveRight className="w-4 h-4 mr-2" />
                    Mover para Manhã
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMove(task.id, 'tarde')}>
                    <MoveRight className="w-4 h-4 mr-2" />
                    Mover para Tarde
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMove(task.id, 'noite')}>
                    <MoveRight className="w-4 h-4 mr-2" />
                    Mover para Noite
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(task.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-2">
              {task.category && <CategoryBadge category={task.category} size="sm" />}
              <PriorityBadge priority={task.priority} size="sm" />
              {task.scheduled_time && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {task.scheduled_time}
                </Badge>
              )}
              {task.recurrence && task.recurrence !== 'none' && (
                <Badge variant="outline" className="text-xs">
                  🔄 {task.recurrence === 'daily' ? 'Diário' : task.recurrence === 'weekly' ? 'Semanal' : 'Mensal'}
                </Badge>
              )}
            </div>

            {/* Indicadores de Anexos/Checklist/Contatos */}
            <div className="flex gap-3 text-xs text-muted-foreground">
              {checklistProgress && checklistProgress.total > 0 && (
                <span className="flex items-center gap-1">
                  <CheckSquare className="w-3 h-3" />
                  {checklistProgress.completed}/{checklistProgress.total}
                </span>
              )}
              {task.contacts && task.contacts.length > 0 && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {task.contacts.length}
                </span>
              )}
              {task.attachments && task.attachments.length > 0 && (
                <span className="flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  {task.attachments.length}
                </span>
              )}
            </div>

            {/* Seção Expansível de Detalhes */}
            {hasDetails && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 h-7 text-xs w-full justify-between"
                  >
                    {isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2">
                  {task.notes && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      {task.notes}
                    </div>
                  )}
                  {checklistProgress && checklistProgress.total > 0 && (
                    <div className="text-xs">
                      <span className="font-medium">Checklist:</span> {checklistProgress.completed} de {checklistProgress.total} concluídos
                    </div>
                  )}
                  {task.contacts && task.contacts.length > 0 && (
                    <div className="text-xs">
                      <span className="font-medium">Contatos:</span>
                      <ul className="ml-4 mt-1">
                        {task.contacts.map(c => (
                          <li key={c.id}>• {c.name} {c.phone && `- ${c.phone}`}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {task.attachments && task.attachments.length > 0 && (
                    <div className="text-xs">
                      <span className="font-medium">Anexos:</span>
                      <ul className="ml-4 mt-1">
                        {task.attachments.map(a => (
                          <li key={a.id}>• {a.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
