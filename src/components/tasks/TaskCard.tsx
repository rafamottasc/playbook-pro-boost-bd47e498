import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Clock, MoreVertical, Edit, Copy, Clock3, MoveRight, Trash2, Paperclip, User, CheckSquare, FileText, Phone, Repeat } from "lucide-react";
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
  return (
    <Card className={cn(
      "transition-all hover:shadow-lg group",
      task.done && "opacity-60 bg-muted/50",
      !task.done && "bg-card"
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Linha 1: Checkbox + Título + Botões de Ação */}
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.done}
            onCheckedChange={() => onToggle(task.id, task.done)}
            className="mt-1"
          />
          
          <h3 
            className={cn(
              "flex-1 font-medium text-sm cursor-pointer hover:text-primary transition-colors",
              task.done && "line-through text-muted-foreground"
            )}
            onClick={() => onEdit(task)}
          >
            {task.title}
          </h3>

          {/* Botões sempre visíveis no desktop */}
          <div className="hidden md:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8"
              onClick={() => onEdit(task)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Menu "⋮" só no mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 md:hidden">
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

        {/* Linha 2: Badges */}
        <div className="flex flex-wrap gap-2 ml-8">
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
              <Repeat className="w-3 h-3 mr-1" />
              {task.recurrence === 'daily' ? 'Diário' : task.recurrence === 'weekly' ? 'Semanal' : 'Mensal'}
            </Badge>
          )}
        </div>

        {/* Linha 3: Informações detalhadas inline */}
        <div className="ml-8 space-y-1.5">
          {task.notes && (
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{task.notes}</span>
            </p>
          )}
          
          {checklistProgress && checklistProgress.total > 0 && (
            <p className="text-xs flex items-center gap-2 text-muted-foreground">
              <CheckSquare className="w-3 h-3" />
              Checklist: {checklistProgress.completed}/{checklistProgress.total}
            </p>
          )}
          
          {task.contacts && task.contacts.length > 0 && (
            <div className="text-xs space-y-0.5">
              {task.contacts.map(c => (
                <p key={c.id} className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-3 h-3" />
                  {c.name}
                  {c.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {c.phone}
                    </span>
                  )}
                </p>
              ))}
            </div>
          )}
          
          {task.attachments && task.attachments.length > 0 && (
            <p className="text-xs flex items-center gap-2 text-muted-foreground">
              <Paperclip className="w-3 h-3" />
              {task.attachments.length} anexo{task.attachments.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
