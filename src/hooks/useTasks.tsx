import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useMemo } from "react";

export interface TaskCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  is_system: boolean;
}

export interface ChecklistItem {
  id: string;
  task_id: string;
  text: string;
  done: boolean;
  display_order: number;
}

export interface TaskContact {
  id: string;
  task_id: string;
  name: string;
  phone?: string;
  address?: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  title: string;
  attachment_type: 'file' | 'link';
  file_url?: string;
  file_type?: 'pdf' | 'image' | 'other';
  url?: string;
}

export interface DailyTask {
  id: string;
  user_id: string;
  category_id?: string;
  title: string;
  notes?: string;
  task_date: string;
  scheduled_time?: string;
  period: 'manha' | 'tarde' | 'noite'; // Deprecated, mantido para compatibilidade
  status: 'todo' | 'in_progress' | 'done';
  priority: 'urgente' | 'importante' | 'normal' | 'baixa';
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  done: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  category?: TaskCategory;
  checklist_items?: ChecklistItem[];
  contacts?: TaskContact[];
  attachments?: TaskAttachment[];
}

export function useTasks(taskDate: string = new Date().toISOString().split('T')[0]) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tasks with all relations
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['daily-tasks', taskDate],
    queryFn: async () => {
      const { data: tasksData, error: tasksError } = await supabase
        .from('daily_tasks')
        .select(`
          *,
          category:task_categories(id, label, icon, color, is_system),
          checklist_items:task_checklist_items(*),
          contacts:task_contacts(*),
          attachments:task_attachments(*)
        `)
        .eq('task_date', taskDate)
        .order('display_order');

      if (tasksError) throw tasksError;
      return (tasksData || []) as DailyTask[];
    },
  });

  // Group tasks by status (Kanban)
  const tasksByStatus = useMemo(() => ({
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  }), [tasks]);

  // Mantém tasksByPeriod para compatibilidade temporária
  const tasksByPeriod = useMemo(() => ({
    manha: tasks.filter(t => t.period === 'manha'),
    tarde: tasks.filter(t => t.period === 'tarde'),
    noite: tasks.filter(t => t.period === 'noite'),
  }), [tasks]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.done).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, completionRate };
  }, [tasks]);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (newTask: Omit<Partial<DailyTask>, 'title'> & { 
      title: string;
      checklist_items?: ChecklistItem[];
      contacts?: TaskContact[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Separar dados relacionados
      const { checklist_items, contacts, ...taskData } = newTask;

      // 1. Criar tarefa principal (apenas campos da tabela daily_tasks)
      // Garantir que period sempre tenha um valor padrão para compatibilidade
      const { data: task, error } = await supabase
        .from('daily_tasks')
        .insert([{ 
          ...taskData, 
          period: taskData.period || 'manha', // Valor padrão para compatibilidade
          user_id: user.id, 
          task_date: taskDate 
        }])
        .select()
        .single();

      if (error) throw error;

      // 2. Salvar checklist
      if (checklist_items && checklist_items.length > 0) {
        const checklistData = checklist_items.map((item, index) => ({
          task_id: task.id,
          text: item.text,
          done: item.done || false,
          display_order: index,
        }));
        await supabase.from('task_checklist_items').insert(checklistData);
      }

      // 3. Salvar contatos
      if (contacts && contacts.length > 0) {
        const contactsData = contacts.map(contact => ({
          task_id: task.id,
          name: contact.name,
          phone: contact.phone || null,
          address: contact.address || null,
        }));
        await supabase.from('task_contacts').insert(contactsData);
      }

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      toast({ title: "Tarefa criada com sucesso!" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao criar tarefa", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Toggle task done - agora alterna status
  const toggleTask = useCallback(async (taskId: string, currentDone: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Alterna entre in_progress e done
    const newStatus = task.status === 'done' ? 'in_progress' : 'done';
    const newDone = newStatus === 'done';

    const { error } = await supabase
      .from('daily_tasks')
      .update({ 
        done: newDone,
        status: newStatus 
      })
      .eq('id', taskId);

    if (error) {
      toast({ 
        title: "Erro ao atualizar tarefa", 
        description: error.message,
        variant: "destructive" 
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
    toast({ title: newDone ? "Tarefa concluída! ✓" : "Tarefa em andamento" });
  }, [tasks, queryClient, toast]);

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DailyTask> & { id: string }) => {
      // Filtrar apenas campos da tabela daily_tasks (remover relacionamentos)
      const { checklist_items, contacts, attachments, category, ...validUpdates } = updates;
      
      const { error } = await supabase
        .from('daily_tasks')
        .update(validUpdates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      toast({ title: "Tarefa atualizada!" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao atualizar", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      toast({ title: "Tarefa excluída" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao excluir", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Duplicate task
  const duplicateTask = useCallback(async (task: DailyTask) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create duplicate task
    const { data: newTask, error: taskError } = await supabase
      .from('daily_tasks')
      .insert([{
        user_id: user.id,
        category_id: task.category_id,
        title: `${task.title} (cópia)`,
        notes: task.notes,
        task_date: task.task_date,
        scheduled_time: task.scheduled_time,
        period: task.period,
        priority: task.priority,
        recurrence: task.recurrence,
        done: false,
      }])
      .select()
      .single();

    if (taskError || !newTask) {
      toast({ title: "Erro ao duplicar tarefa", variant: "destructive" });
      return;
    }

    // Copy checklist items
    if (task.checklist_items && task.checklist_items.length > 0) {
      const checklistCopies = task.checklist_items.map(item => ({
        task_id: newTask.id,
        text: item.text,
        done: false,
        display_order: item.display_order,
      }));

      await supabase.from('task_checklist_items').insert(checklistCopies);
    }

    // Copy contacts
    if (task.contacts && task.contacts.length > 0) {
      const contactsCopies = task.contacts.map(contact => ({
        task_id: newTask.id,
        name: contact.name,
        phone: contact.phone,
        address: contact.address,
      }));

      await supabase.from('task_contacts').insert(contactsCopies);
    }

    queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
    toast({ title: "Tarefa duplicada com sucesso!" });
  }, [queryClient, toast]);

  // Move task to new status (Kanban)
  const moveTaskToStatus = useCallback(async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    const newDone = newStatus === 'done';

    const { error } = await supabase
      .from('daily_tasks')
      .update({ 
        status: newStatus,
        done: newDone 
      })
      .eq('id', taskId);

    if (error) {
      toast({ title: "Erro ao mover tarefa", variant: "destructive" });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
  }, [queryClient, toast]);

  // Toggle checklist item
  const toggleChecklistItem = useCallback(async (taskId: string, itemId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.checklist_items) return;

    const item = task.checklist_items.find(i => i.id === itemId);
    if (!item) return;

    const { error } = await supabase
      .from('task_checklist_items')
      .update({ done: !item.done })
      .eq('id', itemId);

    if (error) {
      toast({ title: "Erro ao atualizar checklist", variant: "destructive" });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
  }, [tasks, queryClient, toast]);

  // Get checklist progress
  const getChecklistProgress = useCallback((task: DailyTask) => {
    const total = task.checklist_items?.length || 0;
    const done = task.checklist_items?.filter(i => i.done).length || 0;
    const percentage = total > 0 ? (done / total) * 100 : 0;
    return { total, done, percentage };
  }, []);

  return {
    tasks,
    tasksByStatus,
    tasksByPeriod, // Deprecated, mantido para compatibilidade
    stats,
    isLoading,
    createTask: createTaskMutation.mutate,
    toggleTask,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    duplicateTask,
    moveTaskToStatus,
    toggleChecklistItem,
    getChecklistProgress,
  };
}
