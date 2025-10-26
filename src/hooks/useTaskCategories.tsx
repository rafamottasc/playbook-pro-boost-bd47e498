import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TaskCategory {
  id: string;
  user_id: string;
  label: string;
  icon: string;
  color: string;
  is_system: boolean;
  display_order: number;
}

export function useTaskCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['task-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return (data || []) as TaskCategory[];
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (newCategory: Omit<TaskCategory, 'id' | 'user_id' | 'is_system'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if label already exists
      const existing = categories.find(c => c.label.toLowerCase() === newCategory.label.toLowerCase());
      if (existing) {
        throw new Error('Já existe uma categoria com este nome');
      }

      const { data, error } = await supabase
        .from('task_categories')
        .insert([{
          ...newCategory,
          user_id: user.id,
          is_system: false,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
      toast({ title: "Categoria criada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskCategory> & { id: string }) => {
      const category = categories.find(c => c.id === id);
      if (category?.is_system) {
        throw new Error('Não é possível editar categorias padrão do sistema');
      }

      const { error } = await supabase
        .from('task_categories')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
      toast({ title: "Categoria atualizada!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const category = categories.find(c => c.id === categoryId);
      if (category?.is_system) {
        throw new Error('Não é possível excluir categorias padrão do sistema');
      }

      // Check if category is in use
      const { count } = await supabase
        .from('daily_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (count && count > 0) {
        throw new Error(`Esta categoria está sendo usada em ${count} tarefa(s). Reatribua as tarefas antes de excluir.`);
      }

      const { error } = await supabase
        .from('task_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
      toast({ title: "Categoria excluída com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    categories,
    isLoading,
    createCategory: createCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
  };
}
