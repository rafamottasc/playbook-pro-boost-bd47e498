import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Clock, MoreVertical, Edit, Copy, Trash2, Paperclip, User, CheckSquare, FileText, Phone, Repeat, CalendarIcon, ChevronDown, ChevronUp, MessageCircle, MapPin, ExternalLink, Download, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  onToggleChecklistItem?: (taskId: string, itemId: string) => void;
  checklistProgress?: { completed: number; total: number };
}

export function TaskCard({ 
  task, 
  onToggle, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onToggleChecklistItem,
  checklistProgress 
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const isOtherDay = task.task_date !== today;

  const hasExpandableContent = 
    (task.notes && task.notes.length > 100) ||
    (task.checklist_items && task.checklist_items.length > 0) ||
    (task.contacts && task.contacts.length > 0) ||
    (task.attachments && task.attachments.length > 0);

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
          {isOtherDay && (
            <Badge variant="outline" className="text-xs">
              <CalendarIcon className="w-3 h-3 mr-1" />
              {format(new Date(task.task_date), "dd/MM", { locale: ptBR })}
            </Badge>
          )}
          {task.recurrence && task.recurrence !== 'none' && (
            <Badge variant="outline" className="text-xs">
              <Repeat className="w-3 h-3 mr-1" />
              {task.recurrence === 'daily' ? 'Diário' : task.recurrence === 'weekly' ? 'Semanal' : 'Mensal'}
            </Badge>
          )}
        </div>

        {/* Linha 3: Informações resumidas */}
        <div className="ml-8 space-y-1.5">
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
          <div className="ml-8 space-y-3 pt-2 border-t">
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
                <div className="space-y-1">
                  {task.checklist_items.map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-xs">
                  <Checkbox 
                    checked={item.done} 
                    onCheckedChange={() => onToggleChecklistItem?.(task.id, item.id)}
                    className="h-3 w-3" 
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
              <div className="space-y-2">
                <p className="text-xs font-medium flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Contatos
                </p>
                <div className="space-y-2">
                  {task.contacts.map(contact => (
                    <div key={contact.id} className="space-y-1 p-2 bg-muted/50 rounded text-xs">
                      <p className="font-medium">{contact.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {contact.phone && (
                          <>
                            <Button size="sm" variant="outline" className="h-6 text-xs" asChild>
                              <a href={`tel:${contact.phone}`}>
                                <Phone className="w-3 h-3 mr-1" />
                                Ligar
                              </a>
                            </Button>
                            <Button size="sm" variant="outline" className="h-6 text-xs" asChild>
                              <a 
                                href={`https://wa.me/55${contact.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MessageCircle className="w-3 h-3 mr-1" />
                                WhatsApp
                              </a>
                            </Button>
                          </>
                        )}
                        {contact.address && (
                          <Button size="sm" variant="outline" className="h-6 text-xs" asChild>
                            <a 
                              href={`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MapPin className="w-3 h-3 mr-1" />
                              Mapa
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anexos completos */}
            {task.attachments && task.attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  Anexos
                </p>
                <div className="space-y-1">
                  {task.attachments.map(attachment => (
                    <div key={attachment.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                      {attachment.attachment_type === 'file' ? (
                        <>
                          {attachment.file_type === 'image' && <ImageIcon className="w-3 h-3" />}
                          {attachment.file_type === 'pdf' && <FileText className="w-3 h-3" />}
                          <span className="flex-1 truncate">{attachment.title}</span>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" asChild>
                            <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                              {attachment.file_type === 'image' ? (
                                <ExternalLink className="w-3 h-3" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                            </a>
                          </Button>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3 h-3" />
                          <span className="flex-1 truncate">{attachment.title}</span>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" asChild>
                            <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botão Expandir/Recolher */}
        {hasExpandableContent && (
          <div className="ml-8 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 text-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Recolher
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Ver mais
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
