import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, Mail, Phone, Ban, Trash2, CheckCircle2, Clock, ShieldMinus, Unlock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UserWithRole {
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
}

export function UsersManager() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [removeAdminUserId, setRemoveAdminUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, whatsapp, avatar_url, created_at, last_sign_in_at, blocked, approved")
        .order("created_at");

      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Identificar o primeiro admin (admin mais antigo)
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
        isFirstAdmin: profile.id === firstAdminId,
      })) || [];

      setUsers(usersWithRoles);
      
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (approved: boolean, blocked: boolean) => {
    if (blocked) {
      return <Badge variant="destructive">Bloqueado</Badge>;
    }
    if (approved) {
      return <Badge className="bg-green-600 hover:bg-green-700 text-white">Ativo</Badge>;
    }
    return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pendente</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const toggleAdminRole = async (userId: string, currentRoles: string[], isFirstAdmin: boolean) => {
    if (isFirstAdmin) {
      toast({
        title: "Ação não permitida",
        description: "O administrador principal do sistema não pode ser removido.",
        variant: "destructive",
      });
      return;
    }

    try {
      const isAdmin = currentRoles.includes("admin");

      if (isAdmin) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (error) throw error;
        toast({ title: "Permissão de admin removida!" });
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: "admin" }]);

        if (error) throw error;
        toast({ title: "Permissão de admin concedida!" });
      }

      setRemoveAdminUserId(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar permissões",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAdminRoleClick = (userId: string, currentRoles: string[], isFirstAdmin: boolean) => {
    const isAdmin = currentRoles.includes("admin");
    
    // Se está removendo admin, mostra confirmação
    if (isAdmin) {
      setRemoveAdminUserId(userId);
    } else {
      // Se está adicionando admin, executa direto
      toggleAdminRole(userId, currentRoles, isFirstAdmin);
    }
  };

  const toggleBlockUser = async (userId: string, currentBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ blocked: !currentBlocked })
        .eq("id", userId);

      if (error) throw error;
      
      toast({ 
        title: currentBlocked ? "Usuário desbloqueado!" : "Usuário bloqueado!",
        description: currentBlocked 
          ? "O usuário pode acessar o sistema novamente." 
          : "O usuário foi impedido de acessar o sistema."
      });
      
      await loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao bloquear/desbloquear usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleApproval = async (userId: string, currentApproved: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ approved: !currentApproved })
        .eq("id", userId);

      if (error) throw error;
      
      toast({ 
        title: currentApproved ? "Aprovação removida!" : "Usuário aprovado!",
        description: currentApproved 
          ? "O usuário não poderá mais acessar o sistema até ser aprovado novamente." 
          : "O usuário agora pode acessar todas as funcionalidades do sistema."
      });
      
      await loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar/desaprovar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      console.log('Iniciando deleção do usuário:', userId);
      
      // Obter token de autenticação atual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Sessão não encontrada. Faça login novamente.');
      }

      console.log('Token de autenticação obtido');

      // Chamar Edge Function para deletar usuário completamente
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
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
        title: "Usuário excluído com sucesso!",
        description: "Todos os dados do usuário foram removidos do sistema."
      });
      
      setDeleteUserId(null);
      await loadUsers();
    } catch (error: any) {
      console.error('Erro completo ao excluir usuário:', error);
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Erro desconhecido ao excluir usuário",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Gerenciar Usuários</h2>
        
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id} className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1 w-full">
                  <Avatar className="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0">
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback className="text-sm sm:text-lg">
                      {user.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg truncate">{user.full_name}</h3>
                    
                    {/* Info Row with Badges */}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 text-xs sm:text-sm pb-3 border-b">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-medium">Nível:</span>
                        {user.roles.includes("admin") ? (
                          <Badge variant="default" className="gap-1 text-xs">
                            <Shield className="h-3 w-3" />
                            <span className="hidden xs:inline">{user.isFirstAdmin ? "Admin Principal" : "Admin"}</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <User className="h-3 w-3" />
                            <span className="hidden xs:inline">Corretor</span>
                          </Badge>
                        )}
                      </div>
                      
                      <span className="text-muted-foreground hidden sm:inline">|</span>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-medium">Status:</span>
                        {getStatusBadge(user.approved, user.blocked)}
                      </div>
                      
                      <span className="text-muted-foreground hidden sm:inline">|</span>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-muted-foreground font-medium whitespace-nowrap">Último Login:</span>
                        <span className="text-xs truncate">{formatDate(user.last_sign_in_at)}</span>
                      </div>
                      
                      <span className="text-muted-foreground hidden md:inline">|</span>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-muted-foreground font-medium whitespace-nowrap">Criado em:</span>
                        <span className="text-xs truncate">{formatDate(user.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {user.email && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <a
                            href={`mailto:${user.email}`}
                            className="flex items-center gap-2 text-muted-foreground hover:text-comarc-green transition-colors truncate"
                          >
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </a>
                        </div>
                      )}
                      
                      {user.whatsapp && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <a
                            href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-muted-foreground hover:text-comarc-green transition-colors"
                          >
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span>{user.whatsapp}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {!user.isFirstAdmin && (
                  <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:min-w-[280px]">
                    {!user.approved && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="default"
                              onClick={() => toggleApproval(user.id, user.approved)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 w-full col-span-2"
                            >
                              <CheckCircle2 className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Aprovar</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Aprovar acesso do usuário ao sistema</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={user.roles.includes("admin") ? "destructive" : "default"}
                            onClick={() => handleAdminRoleClick(user.id, user.roles, user.isFirstAdmin || false)}
                            size="sm"
                            className="w-full"
                          >
                            {user.roles.includes("admin") ? (
                              <>
                                <ShieldMinus className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Remover Admin</span>
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Tornar Admin</span>
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Gerenciar permissão de administrador</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={user.blocked ? "default" : "outline"}
                            onClick={() => toggleBlockUser(user.id, user.blocked)}
                            size="sm"
                            className={`w-full ${!user.blocked ? "border-yellow-600 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800 dark:border-yellow-500 dark:text-yellow-400 dark:hover:bg-yellow-950 dark:hover:text-yellow-300" : ""}`}
                          >
                            {user.blocked ? (
                              <>
                                <Unlock className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Desbloquear</span>
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Bloquear</span>
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{user.blocked ? "Desbloquear usuário" : "Bloquear usuário"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => setDeleteUserId(user.id)}
                            size="sm"
                            className="border-orange-600 text-orange-700 bg-background hover:bg-orange-600 hover:text-white dark:border-orange-500 dark:text-orange-400 dark:hover:bg-orange-500 dark:hover:text-white w-full col-span-2"
                          >
                            <Trash2 className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Excluir</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Excluir usuário</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Dialog de confirmação para exclusão de usuário */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja efetuar essa ação?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir este usuário permanentemente. 
              Esta ação não pode ser desfeita e todos os dados do usuário serão removidos do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteUserId && deleteUser(deleteUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação para remoção de admin */}
      <AlertDialog open={!!removeAdminUserId} onOpenChange={(open) => !open && setRemoveAdminUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja efetuar essa ação?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a remover as permissões de administrador deste usuário. 
              O usuário perderá acesso ao painel administrativo e suas funcionalidades.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (removeAdminUserId) {
                  const user = users.find(u => u.id === removeAdminUserId);
                  if (user) {
                    toggleAdminRole(removeAdminUserId, user.roles, user.isFirstAdmin || false);
                  }
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}