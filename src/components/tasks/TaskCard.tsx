import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Clock, MoreVertical, Edit, Copy, Trash2, Paperclip, User, CheckSquare, FileText, Phone, Repeat, CalendarIcon, ChevronDown, ChevronUp, MessageCircle, MapPin, ExternalLink, Download, Image as ImageIcon, Circle, PlayCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, getDeadlineBadgeColor } from "@/lib/utils";
import { CategoryBadge } from "./CategoryBadge";
import { PriorityBadge } from "./PriorityBadge";
import type { DailyTask } from "@/hooks/useTasks";

interface TaskCardProps {
  task: DailyTask;
  onToggle: (taskId: string, currentDone: boolean) => void;
  onEdit: (task: DailyTask) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onToggleChecklistItem?: (taskId: string, itemId: string) => void;
  checklistProgress?: { completed: number; total: number };
  onMoveToStatus?: (taskId: string, status: 'todo' | 'in_progress' | 'done') => void;
}

export function TaskCard({ 
  task, 
  onToggle, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onToggleChecklistItem,
  checklistProgress,
  onMoveToStatus
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasExpandableContent = 
    (task.notes && task.notes.length > 100) ||
    (task.checklist_items && task.checklist_items.length > 0) ||
    (task.contacts && task.contacts.length > 0) ||
    (task.attachments && task.attachments.length > 0);

  return (
    <Card className={cn(
      "transition-all hover:shadow-lg group border-border dark:border-primary/20",
      task.done && "opacity-60 bg-muted/50",
      !task.done && "bg-card"
    )}>
      <CardContent className="px-4 py-3 md:px-4 md:py-4 space-y-2 md:space-y-3 relative">
        {/* Botões de ação - posicionamento absoluto no canto superior direito */}
        <div className="absolute top-2 right-2 md:top-3 md:right-3 flex items-start gap-1 z-10">
          {/* Expand button - visible on both mobile and desktop */}
          {hasExpandableContent && (
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="h-7 w-7 md:h-8 md:w-8"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}

          {/* Menu "⋮" em desktop e mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 md:h-8 md:w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(task.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(task.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Header: Reorganizado em duas linhas */}
        <div className="flex flex-col gap-2">
          {/* Linha 1: Checkbox + Tag de Prioridade */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={task.done}
              onCheckedChange={() => onToggle(task.id, task.done)}
              className="h-5 w-5 flex-shrink-0"
            />
            <PriorityBadge priority={task.priority} size="sm" className="flex-shrink-0" />
          </div>

          {/* Linha 2: Título ocupando toda a largura */}
          <h3 
            className={cn(
              "font-medium cursor-pointer hover:text-primary transition-colors",
              "w-full pr-16 md:pr-20",
              "break-words whitespace-normal leading-snug text-[0.95rem]",
              task.done && "line-through text-muted-foreground"
            )}
            onClick={() => onEdit(task)}
          >
            {task.title}
          </h3>
        </div>

        {/* Linha 3: Badges */}
        <div className="flex flex-wrap gap-2">
          {task.category && <CategoryBadge category={task.category} size="sm" />}
          {task.scheduled_time && (
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {task.scheduled_time.slice(0, 5)}
            </Badge>
          )}
          {task.task_date && (() => {
            const { variant, className } = getDeadlineBadgeColor(task.task_date, task.done ? 'done' : 'todo');
            
            return (
              <Badge variant={variant} className={cn("text-xs font-medium", className)}>
                <CalendarIcon className="w-3 h-3 mr-1" />
                {format(new Date(task.task_date + 'T00:00:00'), "dd MMM", { locale: ptBR })}
              </Badge>
            );
          })()}
          {task.recurrence && task.recurrence !== 'none' && (
            <Badge variant="outline" className="text-xs">
              <Repeat className="w-3 h-3 mr-1" />
              {task.recurrence === 'daily' ? 'Diário' : task.recurrence === 'weekly' ? 'Semanal' : 'Mensal'}
            </Badge>
          )}
        </div>

        {/* Linha 4: Informações resumidas */}
        <div className="space-y-1.5">
          {/* Notas - resumo */}
          {task.notes && !isExpanded && (
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{task.notes}</span>
            </p>
          )}
          
          {/* Indicadores de conteúdo */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
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
        </div>

        {/* Conteúdo Expandido */}
        {isExpanded && (
          <div className="space-y-2 md:space-y-2.5 lg:space-y-3 pt-2 border-t">
            {/* Notas completas */}
            {task.notes && (
              <div className="space-y-1">
                <p className="text-xs font-medium flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Notas
                </p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{task.notes}</p>
              </div>
            )}

            {/* Checklist completo */}
            {task.checklist_items && task.checklist_items.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium flex items-center gap-1">
                  <CheckSquare className="w-3 h-3" />
                  Checklist
                </p>
                <div className="space-y-0.5">
                  {task.checklist_items.map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-xs py-1">
                  <Checkbox 
                    checked={item.done} 
                    onCheckedChange={() => onToggleChecklistItem?.(task.id, item.id)}
                    className="h-4 w-4"
                  />
                      <span className={cn(item.done && "line-through text-muted-foreground")}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contatos completos */}
            {task.contacts && task.contacts.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Contatos
                </p>
                <div className="space-y-1.5">
                  {task.contacts.map(contact => (
                    <div key={contact.id} className="space-y-1.5 p-2 bg-muted/50 rounded text-xs">
                      <p className="font-medium text-sm">{contact.name}</p>
                      
                      {contact.phone && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <Phone className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <a 
                              href={`https://wa.me/55${contact.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary transition-colors inline-flex items-center gap-1"
                            >
                              <span>{contact.phone}</span>
                              <MessageCircle className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {contact.address && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <a 
                              href={`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary transition-colors inline-flex items-start gap-1 text-left"
                            >
                              <span className="break-words">{contact.address}</span>
                              <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anexos completos */}
            {task.attachments && task.attachments.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  Anexos
                </p>
                <div className="space-y-0.5">
                  {task.attachments.map(attachment => (
                    <div 
                      key={attachment.id} 
                      className="flex items-center gap-2 p-1.5 bg-muted/50 rounded text-xs cursor-pointer hover:bg-muted transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = attachment.attachment_type === 'file' 
                          ? attachment.file_url 
                          : attachment.url;
                        if (url) window.open(url, '_blank');
                      }}
                    >
                      {attachment.attachment_type === 'file' ? (
                        <>
                          {attachment.file_type === 'image' && <ImageIcon className="w-3 h-3" />}
                          {attachment.file_type === 'pdf' && <FileText className="w-3 h-3" />}
                          <span className="flex-1 truncate">{attachment.title}</span>
                          {attachment.file_type === 'image' ? (
                            <ExternalLink className="w-3 h-3" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3 h-3" />
                          <span className="flex-1 truncate">{attachment.title}</span>
                          <ExternalLink className="w-3 h-3" />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
