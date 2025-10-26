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
import { useTaskCategories } from "@/hooks/useTaskCategories";
import { TaskChecklistManager } from "./TaskChecklistManager";
import { TaskContactsManager } from "./TaskContactsManager";
import { TaskAttachmentsManager } from "./TaskAttachmentsManager";
import { CategoryBadge } from "./CategoryBadge";
import type { DailyTask } from "@/hooks/useTasks";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: DailyTask | null;
  defaultPeriod?: 'manha' | 'tarde' | 'noite';
  onSave: (taskData: Partial<DailyTask>) => void;
}

export function TaskFormDialog({ open, onOpenChange, task, defaultPeriod, onSave }: TaskFormDialogProps) {
  const isMobile = useIsMobile();
  const { categories } = useTaskCategories();

  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    period: defaultPeriod || 'manha',
    scheduled_time: '',
    priority: 'normal' as 'baixa' | 'normal' | 'importante' | 'urgente',
    notes: '',
    recurrence: 'none' as 'none' | 'daily' | 'weekly' | 'monthly',
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        category_id: task.category_id || '',
        period: task.period || 'manha',
        scheduled_time: task.scheduled_time || '',
        priority: task.priority || 'normal',
        notes: task.notes || '',
        recurrence: task.recurrence || 'none',
      });
    } else if (defaultPeriod) {
      setFormData(prev => ({ ...prev, period: defaultPeriod }));
    }
  }, [task, defaultPeriod]);

  const handleSave = () => {
    if (!formData.title.trim()) return;
    onSave(formData);
    onOpenChange(false);
    // Reset form
    setFormData({
      title: '',
      category_id: '',
      period: defaultPeriod || 'manha',
      scheduled_time: '',
      priority: 'normal',
      notes: '',
      recurrence: 'none',
    });
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

      {/* Categoria */}
      <div className="space-y-2">
        <Label htmlFor="category">Categoria</Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => setFormData({ ...formData, category_id: value })}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
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

      {/* Período e Horário */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="period">Período</Label>
          <Select
            value={formData.period}
            onValueChange={(value: any) => setFormData({ ...formData, period: value })}
          >
            <SelectTrigger id="period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manha">🌅 Manhã</SelectItem>
              <SelectItem value="tarde">☀️ Tarde</SelectItem>
              <SelectItem value="noite">🌙 Noite</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Prioridade */}
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

      {/* Seções Expansíveis */}
      <Accordion type="multiple" className="w-full">
        {/* Detalhes */}
        <AccordionItem value="details">
          <AccordionTrigger>Detalhes</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Adicione observações..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
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
                  <SelectItem value="daily">Todos os dias</SelectItem>
                  <SelectItem value="weekly">Toda semana</SelectItem>
                  <SelectItem value="monthly">Todo mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Checklist - Simplificado */}
        <AccordionItem value="checklist">
          <AccordionTrigger>Checklist</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground">Checklist em desenvolvimento</p>
          </AccordionContent>
        </AccordionItem>

        {/* Contatos - Simplificado */}
        <AccordionItem value="contacts">
          <AccordionTrigger>Contatos</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground">Contatos em desenvolvimento</p>
          </AccordionContent>
        </AccordionItem>

        {/* Anexos - Simplificado */}
        <AccordionItem value="attachments">
          <AccordionTrigger>Anexos</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground">Anexos em desenvolvimento</p>
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
