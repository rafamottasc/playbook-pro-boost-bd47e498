import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTaskCategories } from "@/hooks/useTaskCategories";
import { TaskChecklistManager } from "./TaskChecklistManager";
import { TaskContactsManager } from "./TaskContactsManager";
import { TaskAttachmentsManager } from "./TaskAttachmentsManager";
import { CategoryBadge } from "./CategoryBadge";
import type { DailyTask, ChecklistItem, TaskContact, TaskAttachment } from "@/hooks/useTasks";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: DailyTask | null;
  defaultStatus?: 'todo' | 'in_progress' | 'done';
  onSave: (taskData: Partial<DailyTask>) => void;
}

export function TaskFormDialog({ open, onOpenChange, task, defaultStatus, onSave }: TaskFormDialogProps) {
  const isMobile = useIsMobile();
  const { categories } = useTaskCategories();

  const [formData, setFormData] = useState({
    title: '',
    category_id: null as string | null,
    status: defaultStatus || 'todo' as 'todo' | 'in_progress' | 'done',
    task_date: new Date().toISOString().split('T')[0],
    scheduled_time: '',
    priority: 'normal' as 'baixa' | 'normal' | 'importante' | 'urgente',
    notes: '',
    recurrence: 'none' as 'none' | 'daily' | 'weekly' | 'monthly',
    period: 'manha' as 'manha' | 'tarde' | 'noite', // Valor padrão para compatibilidade
  });

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [contacts, setContacts] = useState<TaskContact[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (open && !task) {
      // Reset form when opening for a new task
      const dateToUse = new Date().toISOString().split('T')[0];
      setFormData({
        title: '',
        category_id: null,
        status: defaultStatus || 'todo',
        task_date: dateToUse,
        scheduled_time: '',
        priority: 'normal',
        notes: '',
        recurrence: 'none',
        period: 'manha',
      });
      setSelectedDate(new Date(dateToUse + 'T00:00:00'));
      setChecklistItems([]);
      setContacts([]);
      setAttachments([]);
    } else if (task) {
      // Populate form when editing existing task
      setFormData({
        title: task.title || '',
        category_id: task.category_id || null,
        status: task.status || 'todo',
        task_date: task.task_date || new Date().toISOString().split('T')[0],
        scheduled_time: task.scheduled_time || '',
        priority: task.priority || 'normal',
        notes: task.notes || '',
        recurrence: task.recurrence || 'none',
        period: task.period || 'manha',
      });
      setSelectedDate(new Date((task.task_date || new Date().toISOString().split('T')[0]) + 'T00:00:00'));
      setChecklistItems(task.checklist_items || []);
      setContacts(task.contacts || []);
      setAttachments(task.attachments || []);
    }
  }, [open, task, defaultStatus]);

  const handleSave = () => {
    if (!formData.title.trim()) return;
    
    // Converter "__none__" e strings vazias em null para category_id
    const categoryId = formData.category_id === '__none__' || !formData.category_id 
      ? null 
      : formData.category_id;
    
    // Envia apenas os campos da tabela daily_tasks + dados relacionados
    onSave({
      ...formData,
      category_id: categoryId,
      scheduled_time: formData.scheduled_time.trim() || null, // Aceitar horário vazio
      checklist_items: checklistItems,
      contacts,
      // Attachments são gerenciados separadamente pelo TaskAttachmentsManager
    });
    onOpenChange(false);
    // Reset form
    const dateToUse = new Date().toISOString().split('T')[0];
    setFormData({
      title: '',
      category_id: null,
      status: defaultStatus || 'todo',
      task_date: dateToUse,
      scheduled_time: '',
      priority: 'normal',
      notes: '',
      recurrence: 'none',
      period: 'manha', // Valor padrão para compatibilidade
    });
    setSelectedDate(new Date(dateToUse + 'T00:00:00'));
    setChecklistItems([]);
    setContacts([]);
    setAttachments([]);
  };

  const FormContent = (
    <div className="space-y-4 py-4">
      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="title">Título da Tarefa *</Label>
        <Input
          id="title"
          placeholder="Ex: Ligar para o cliente"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      {/* Notas/Detalhes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Detalhes</Label>
        <Textarea
          id="notes"
          placeholder="Adicione observações..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      {/* Categoria, Prioridade e Recorrência */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select
            value={formData.category_id || undefined}
            onValueChange={(value) => setFormData({ ...formData, category_id: value })}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Sem categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sem categoria</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={cat} size="sm" />
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="importante">Importante</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recurrence">Recorrência</Label>
          <Select
            value={formData.recurrence}
            onValueChange={(value: any) => setFormData({ ...formData, recurrence: value })}
          >
            <SelectTrigger id="recurrence">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Não repetir</SelectItem>
              <SelectItem value="daily">Diário</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data e Horário */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setFormData({ ...formData, task_date: format(date, 'yyyy-MM-dd') });
                  }
                }}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Horário</Label>
          <Input
            id="time"
            type="time"
            value={formData.scheduled_time}
            onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
          />
        </div>
      </div>

      {/* Seções Expansíveis */}
      <Accordion type="multiple" className="w-full">

        {/* Checklist */}
        <AccordionItem value="checklist">
          <AccordionTrigger>Checklist</AccordionTrigger>
          <AccordionContent>
            <TaskChecklistManager 
              items={checklistItems} 
              onChange={setChecklistItems} 
            />
          </AccordionContent>
        </AccordionItem>

        {/* Contatos */}
        <AccordionItem value="contacts">
          <AccordionTrigger>Contatos</AccordionTrigger>
          <AccordionContent>
            <TaskContactsManager 
              contacts={contacts} 
              onChange={setContacts} 
            />
          </AccordionContent>
        </AccordionItem>

        {/* Anexos */}
        <AccordionItem value="attachments">
          <AccordionTrigger>Anexos</AccordionTrigger>
          <AccordionContent>
            {task ? (
              <TaskAttachmentsManager 
                taskId={task.id} 
                attachments={attachments} 
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Salve a tarefa primeiro para adicionar anexos.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  const FooterButtons = (
    <>
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Cancelar
      </Button>
      <Button onClick={handleSave} disabled={!formData.title.trim()}>
        {task ? 'Salvar' : 'Criar Tarefa'}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 overflow-y-auto">
            {FormContent}
          </div>
          <DrawerFooter className="flex-row gap-2">
            {FooterButtons}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>
        {FormContent}
        <DialogFooter>
          {FooterButtons}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
