import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserMetrics {
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  lastWatchedLesson: {
    title: string;
    watchedAt: string;
  } | null;
  points: number;
}

export interface UserWithRole {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp: string;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  blocked: boolean;
  approved: boolean;
  roles: string[];
  isFirstAdmin?: boolean;
  metrics?: UserMetrics;
  team?: string | null;
}

/**
 * Hook para gerenciamento completo de usuários (CRUD + métricas)
 * Centraliza toda lógica de administração de usuários
 */
export const useUsersManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  /**
   * Carrega lista completa de usuários com roles
   * Identifica automaticamente o primeiro admin (mais antigo)
   */
  const loadUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, whatsapp, avatar_url, created_at, last_sign_in_at, blocked, approved, team")
        .order("created_at");

      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // ✅ CRÍTICO: Identificar o primeiro admin (admin mais antigo)
      const adminProfiles = profiles?.filter(p => 
        userRoles?.some(ur => ur.user_id === p.id && ur.role === 'admin')
      );
      const firstAdminId = adminProfiles?.[0]?.id;

      const usersWithRoles = profiles?.map((profile) => ({
        ...profile,
        blocked: profile.blocked === true,
        approved: profile.approved === true,
        last_sign_in_at: profile.last_sign_in_at,
        roles: userRoles
          ?.filter((role) => role.user_id === profile.id)
          .map((role) => role.role) || [],
        isFirstAdmin: profile.id === firstAdminId, // ✅ Marca primeiro admin
      })) || [];

      setUsers(usersWithRoles);
      
    } catch (error: any) {
      toast({
        title: "❌ Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carrega métricas de progresso da Academy para um usuário específico
   * Busca: total de aulas, aulas completas, última aula assistida, pontos
   */
  const loadUserMetrics = async (userId: string): Promise<UserMetrics> => {
    try {
      // Buscar total de aulas disponíveis
      const { count: totalLessons } = await supabase
        .from("academy_lessons")
        .select("*", { count: "exact", head: true })
        .eq("published", true);

      // Buscar progresso do usuário
      const { data: progress } = await supabase
        .from("user_lesson_progress")
        .select(`
          watched,
          watched_at,
          lesson:academy_lessons(title)
        `)
        .eq("user_id", userId)
        .order("watched_at", { ascending: false });

      const completedLessons = progress?.filter(p => p.watched).length || 0;
      const progressPercentage = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

      // Última aula assistida
      const lastWatched = progress?.find(p => p.watched && p.watched_at);
      const lastWatchedLesson = lastWatched ? {
        title: (lastWatched.lesson as any)?.title || "Sem título",
        watchedAt: lastWatched.watched_at
      } : null;

      // Buscar pontos do perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", userId)
        .single();

      return {
        totalLessons: totalLessons || 0,
        completedLessons,
        progressPercentage,
        lastWatchedLesson,
        points: profile?.points || 0
      };
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
      return {
        totalLessons: 0,
        completedLessons: 0,
        progressPercentage: 0,
        lastWatchedLesson: null,
        points: 0
      };
    }
  };

  /**
   * Adiciona ou remove role de admin
   * ✅ CRÍTICO: Primeiro admin do sistema não pode ser removido
   */
  const toggleAdminRole = async (
    userId: string, 
    currentRoles: string[], 
    isFirstAdmin: boolean
  ) => {
    // ✅ PROTEÇÃO: Primeiro admin não pode ser removido
    if (isFirstAdmin) {
      toast({
        title: "Ação não permitida",
        description: "O administrador principal do sistema não pode ser removido.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const isAdmin = currentRoles.includes("admin");

      if (isAdmin) {
        // Remover admin
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (error) throw error;
        toast({ 
          title: "✅ Permissão removida",
          description: "O usuário não é mais administrador."
        });
      } else {
        // Adicionar admin
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: "admin" }]);

        if (error) throw error;
        toast({ 
          title: "✅ Permissão concedida",
          description: "O usuário agora é administrador."
        });
      }

      await loadUsers();
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar permissões",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Bloqueia ou desbloqueia usuário
   */
  const toggleBlockUser = async (userId: string, currentBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ blocked: !currentBlocked })
        .eq("id", userId);

      if (error) throw error;
      
      toast({ 
        title: currentBlocked ? "🔓 Usuário desbloqueado" : "🚫 Usuário bloqueado",
        description: currentBlocked 
          ? "O usuário pode acessar o sistema novamente." 
          : "O usuário foi impedido de acessar o sistema."
      });
      
      await loadUsers();
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao bloquear/desbloquear usuário",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Aprova ou remove aprovação de usuário
   */
  const toggleApproval = async (userId: string, currentApproved: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ approved: !currentApproved })
        .eq("id", userId);

      if (error) throw error;
      
      toast({ 
        title: currentApproved ? "❌ Aprovação removida" : "✅ Usuário aprovado",
        description: currentApproved 
          ? "O usuário não poderá mais acessar o sistema até ser aprovado novamente." 
          : "O usuário agora pode acessar todas as funcionalidades do sistema."
      });
      
      await loadUsers();
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar/desaprovar usuário",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Deleta usuário completamente via Edge Function
   * ✅ CRÍTICO: Envia session.access_token para autenticação
   */
  const deleteUser = async (userId: string) => {
    try {
      console.log('Iniciando deleção do usuário:', userId);
      
      // ✅ CRÍTICO: Obter token de autenticação atual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Sessão não encontrada. Faça login novamente.');
      }

      console.log('Token de autenticação obtido');

      // ✅ Chamar Edge Function com token de autenticação
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
        headers: {
          Authorization: `Bearer ${session.access_token}` // ✅ Token obrigatório
        }
      });

      console.log('Resposta da Edge Function:', { data, error });

      if (error) {
        console.error('Erro ao invocar Edge Function:', error);
        throw error;
      }
      
      if (data?.error) {
        console.error('Erro retornado pela Edge Function:', data.error);
        throw new Error(data.error);
      }
      
      toast({ 
        title: "✅ Usuário excluído com sucesso",
        description: "Todos os dados do usuário foram removidos do sistema."
      });
      
      await loadUsers();
      return true;
    } catch (error: any) {
      console.error('Erro completo ao excluir usuário:', error);
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Erro desconhecido ao excluir usuário",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    users,
    loading,
    setUsers,
    loadUsers,
    loadUserMetrics,
    toggleAdminRole,
    toggleBlockUser,
    toggleApproval,
    deleteUser,
  };
};
