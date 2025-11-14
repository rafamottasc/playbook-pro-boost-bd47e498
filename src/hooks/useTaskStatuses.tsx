import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export interface TaskStatus {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  color: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const MAX_STATUSES = 6;

export function useTaskStatuses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch statuses
  const { data: statuses = [], isLoading } = useQuery({
    queryKey: ['task-statuses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await (supabase as any)
        .from('task_statuses')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order');

      if (error) throw error;
      return (data || []) as TaskStatus[];
    },
  });

  // Create status mutation
  const createStatusMutation = useMutation({
    mutationFn: async (newStatus: { name: string; color?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Validar limite de 6 etapas
      if (statuses.length >= MAX_STATUSES) {
        throw new Error(`Você já atingiu o limite de ${MAX_STATUSES} etapas`);
      }

      // Validar nome não vazio
      if (!newStatus.name.trim()) {
        throw new Error('O nome da etapa não pode estar vazio');
      }

      // Criar slug a partir do nome (remover acentos, espaços, etc)
      const slug = newStatus.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]+/g, '_') // Substitui caracteres especiais por _
        .replace(/^_+|_+$/g, ''); // Remove _ do início e fim

      // Verificar se slug já existe
      const existing = statuses.find(s => s.slug === slug);
      if (existing) {
        throw new Error('Já existe uma etapa com este nome');
      }

      const { data, error } = await (supabase as any)
        .from('task_statuses')
        .insert([{
          user_id: user.id,
          name: newStatus.name.trim(),
          slug,
          color: newStatus.color || '#6b7280',
          display_order: statuses.length + 1,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-statuses'] });
      toast({ title: "Etapa criada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar etapa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskStatus> & { id: string }) => {
      // Se estiver atualizando o nome, validar e recalcular slug
      const updateData: any = { ...updates };
      
      if (updates.name) {
        if (!updates.name.trim()) {
          throw new Error('O nome da etapa não pode estar vazio');
        }
        
        updateData.name = updates.name.trim();
        
        // Recalcular slug
        const newSlug = updates.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        
        // Verificar se novo slug já existe (exceto no próprio registro)
        const existing = statuses.find(s => s.slug === newSlug && s.id !== id);
        if (existing) {
          throw new Error('Já existe uma etapa com este nome');
        }
        
        updateData.slug = newSlug;
      }

      const { error } = await (supabase as any)
        .from('task_statuses')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-statuses'] });
      toast({ title: "Etapa atualizada!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar etapa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete status mutation
  const deleteStatusMutation = useMutation({
    mutationFn: async (statusId: string) => {
      // Verificar se há tarefas nesta etapa
      const { count } = await (supabase as any)
        .from('daily_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('status_id', statusId);

      if (count && count > 0) {
        throw new Error(`Esta etapa possui ${count} tarefa(s). Mova ou exclua as tarefas antes de deletar a etapa.`);
      }

      const { error } = await (supabase as any)
        .from('task_statuses')
        .delete()
        .eq('id', statusId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      toast({ title: "Etapa excluída com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir etapa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reorder statuses mutation
  const reorderStatusesMutation = useMutation({
    mutationFn: async (reorderedStatuses: { id: string; display_order: number }[]) => {
      const updates = reorderedStatuses.map(({ id, display_order }) =>
        (supabase as any)
          .from('task_statuses')
          .update({ display_order })
          .eq('id', id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-statuses'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao reordenar etapas",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-criar etapas padrão para novos usuários
  useEffect(() => {
    const initializeDefaultStatuses = async () => {
      // Só inicializar se não está carregando e não tem nenhuma etapa
      if (isLoading || statuses.length > 0) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const defaultStatuses = [
        { name: 'A Fazer', color: '#3b82f6', display_order: 0 },
        { name: 'Em Andamento', color: '#f59e0b', display_order: 1 },
        { name: 'Concluída', color: '#10b981', display_order: 2 },
      ];

      try {
        for (const status of defaultStatuses) {
          const slug = status.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');

          await (supabase as any)
            .from('task_statuses')
            .insert({
              user_id: user.id,
              name: status.name,
              slug,
              color: status.color,
              display_order: status.display_order,
            });
        }

        queryClient.invalidateQueries({ queryKey: ['task-statuses'] });
      } catch (error) {
        console.error('Erro ao criar etapas padrão:', error);
      }
    };

    initializeDefaultStatuses();
  }, [isLoading, statuses.length, queryClient]);

  return {
    statuses,
    isLoading,
    createStatus: createStatusMutation.mutate,
    isCreating: createStatusMutation.isPending,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
    deleteStatus: deleteStatusMutation.mutate,
    isDeleting: deleteStatusMutation.isPending,
    reorderStatuses: reorderStatusesMutation.mutate,
    isReordering: reorderStatusesMutation.isPending,
    maxStatuses: MAX_STATUSES,
    canCreateMore: statuses.length < MAX_STATUSES,
  };
}
