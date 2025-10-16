import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, Mail, Phone, Ban, Trash2, CheckCircle2, Clock, ShieldMinus, Unlock, ChevronDown, BookOpen, Trophy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { formatPhone } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
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
  metrics?: UserMetrics;
  team?: string | null;
}

export function UsersManager() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [removeAdminUserId, setRemoveAdminUserId] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

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
        title: "❌ Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = users.slice(startIndex, endIndex);

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

  const getLastActivityStatus = (lastSignIn: string | null) => {
    if (!lastSignIn) return { 
      text: "Nunca", 
      status: "offline", 
      color: "text-muted-foreground",
      badge: "⚪"
    };

    const now = new Date();
    const lastActivity = new Date(lastSignIn);
    
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    console.log('[Status Atividade]', {
      now: now.toISOString(),
      lastActivity: lastActivity.toISOString(),
      diffMinutes,
      diffMs
    });

    if (diffMinutes < 5) {
      return {
        text: "Online agora",
        status: "online",
        color: "text-green-600",
        badge: "🟢"
      };
    }

    if (diffMinutes < 60) {
      return {
        text: `Há ${diffMinutes} min`,
        status: "recent",
        color: "text-green-500",
        badge: "🟡"
      };
    }

    try {
      return {
        text: formatDistanceToNow(lastActivity, { 
          addSuffix: true, 
          locale: ptBR 
        }),
        status: "offline",
        color: "text-muted-foreground",
        badge: "⚪"
      };
    } catch {
      return {
        text: "Data inválida",
        status: "offline",
        color: "text-muted-foreground",
        badge: "⚪"
      };
    }
  };

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

  const handleExpand = async (userId: string) => {
    const newExpandedUsers = new Set(expandedUsers);
    
    if (expandedUsers.has(userId)) {
      newExpandedUsers.delete(userId);
    } else {
      newExpandedUsers.add(userId);
      
      // Se está expandindo e ainda não tem métricas, buscar
      const user = users.find(u => u.id === userId);
      if (user && !user.metrics) {
        try {
          const metrics = await loadUserMetrics(userId);
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, metrics } : u
          ));
        } catch (error) {
          console.error("Erro ao carregar métricas:", error);
          toast({
            title: "Erro ao carregar métricas",
            description: "Não foi possível carregar as informações de progresso.",
            variant: "destructive"
          });
        }
      }
    }
    
    setExpandedUsers(newExpandedUsers);
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
      toast({ 
        title: "✅ Permissão removida",
        description: "O usuário não é mais administrador."
      });
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: "admin" }]);

        if (error) throw error;
        toast({ 
          title: "✅ Permissão concedida",
          description: "O usuário agora é administrador."
        });
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
        title: currentBlocked ? "🔓 Usuário desbloqueado" : "🚫 Usuário bloqueado",
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
        title: currentApproved ? "❌ Aprovação removida" : "✅ Usuário aprovado",
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
        title: "✅ Usuário excluído com sucesso",
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
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Gerenciar Usuários</h2>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full max-w-md" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Gerenciar Usuários</h2>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Total: {users.length} usuários
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm">Mostrar:</span>
            <Select value={itemsPerPage.toString()} onValueChange={(v) => {
              setItemsPerPage(Number(v));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4">
          {paginatedUsers.map((user) => {
            const isExpanded = expandedUsers.has(user.id);
            const activityStatus = getLastActivityStatus(user.last_sign_in_at);
            
            return (
              <Card key={user.id} className="p-3 sm:p-6 overflow-hidden">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <Avatar className="h-10 w-10 sm:h-16 sm:w-16 flex-shrink-0">
                      <AvatarImage src={user.avatar_url || ""} loading="lazy" />
                      <AvatarFallback className="text-sm sm:text-lg">
                        {user.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm sm:text-lg truncate">
                          {user.full_name}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExpand(user.id)}
                          className="flex-shrink-0 h-8 px-2"
                        >
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </motion.div>
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs pb-2 border-b">
                        {user.roles.includes("admin") ? (
                          <Badge variant="default" className="gap-1">
                            <Shield className="h-3 w-3" />
                            <span className="hidden sm:inline">
                              {user.isFirstAdmin ? "Admin Principal" : "Admin"}
                            </span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <User className="h-3 w-3" />
                            <span className="hidden sm:inline">Corretor</span>
                          </Badge>
                        )}
                        
                        {getStatusBadge(user.approved, user.blocked)}
                        
                        <div className="flex items-center gap-1 text-xs">
                          <span>{activityStatus.badge}</span>
                          <span className={`hidden sm:inline ${activityStatus.color}`}>
                            {activityStatus.text}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 mt-2 text-xs sm:text-sm">
                        {user.email && (
                          <a
                            href={`mailto:${user.email}`}
                            className="flex items-center gap-2 text-muted-foreground hover:text-comarc-green transition-colors"
                          >
                            <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </a>
                        )}

                        {user.whatsapp && (
                          <a
                            href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-muted-foreground hover:text-comarc-green transition-colors"
                          >
                            <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{formatPhone(user.whatsapp)}</span>
                          </a>
                        )}

                        {user.team && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Shield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">
                              {user.team === 'Equipe Leão' && '🦁 '}
                              {user.team === 'Equipe Lobo' && '🐺 '}
                              {user.team === 'Equipe Águia' && '🦅 '}
                              {user.team}
                            </span>
                          </div>
                        )}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 border-t mt-4 space-y-4">
                              {user.metrics && (
                                <div className="space-y-2">
                                  <h4 className="font-semibold flex items-center gap-2 text-sm">
                                    <BookOpen className="h-4 w-4" />
                                    Aprendizado e Progresso
                                  </h4>
                                  
                                  <div className="text-sm space-y-2">
                                    <p className="text-muted-foreground">
                                      Aulas concluídas: <span className="font-medium text-foreground">{user.metrics.completedLessons}</span> de <span className="font-medium text-foreground">{user.metrics.totalLessons}</span> ({user.metrics.progressPercentage}%)
                                    </p>
                                    
                                    <Progress value={user.metrics.progressPercentage} className="h-2" />
                                    
                                    {user.metrics.lastWatchedLesson && (
                                      <p className="text-muted-foreground flex items-start gap-1">
                                        <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                        <span>
                                          Última aula: <span className="font-medium text-foreground">"{user.metrics.lastWatchedLesson.title}"</span>{" "}
                                          {formatDistanceToNow(new Date(user.metrics.lastWatchedLesson.watchedAt), { 
                                            addSuffix: true, 
                                            locale: ptBR 
                                          })}
                                        </span>
                                      </p>
                                    )}
                                    
                                    <p className="flex items-center gap-1">
                                      <Trophy className="h-3 w-3 text-yellow-500" />
                                      <span className="text-muted-foreground">
                                        Pontos acumulados: <span className="font-medium text-foreground">{user.metrics.points} pts</span>
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2 text-sm">
                                  <Clock className="h-4 w-4" />
                                  Informações de Acesso
                                </h4>
                                
                                <div className="text-sm space-y-1 text-muted-foreground">
                                  <p>Criado em: <span className="font-medium text-foreground">{formatDate(user.created_at)}</span></p>
                                  <p>Último acesso: <span className="font-medium text-foreground">{formatDate(user.last_sign_in_at)}</span></p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {!user.isFirstAdmin && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t">
                      {!user.approved && (
                        <Button
                          variant="default"
                          onClick={() => toggleApproval(user.id, user.approved)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial sm:w-auto min-w-[140px]"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          <span className="text-xs">Aprovar</span>
                        </Button>
                      )}

                      <Button
                        variant={user.roles.includes("admin") ? "destructive" : "default"}
                        onClick={() => handleAdminRoleClick(user.id, user.roles, user.isFirstAdmin || false)}
                        size="sm"
                        className="flex-1 sm:flex-initial sm:w-auto min-w-[120px]"
                      >
                        {user.roles.includes("admin") ? (
                          <>
                            <ShieldMinus className="h-4 w-4 mr-1" />
                            <span className="text-xs hidden sm:inline">Remover Admin</span>
                            <span className="text-xs sm:hidden">Rem. Admin</span>
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-1" />
                            <span className="text-xs hidden sm:inline">Tornar Admin</span>
                            <span className="text-xs sm:hidden">Add Admin</span>
                          </>
                        )}
                      </Button>

                      <Button
                        variant={user.blocked ? "default" : "outline"}
                        onClick={() => toggleBlockUser(user.id, user.blocked)}
                        size="sm"
                        className={`flex-1 sm:flex-initial sm:w-auto min-w-[100px] ${
                          !user.blocked 
                            ? "border-yellow-600 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800 dark:border-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300" 
                            : ""
                        }`}
                      >
                        {user.blocked ? (
                          <>
                            <Unlock className="h-4 w-4 mr-1" />
                            <span className="text-xs">Desbloquear</span>
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4 mr-1" />
                            <span className="text-xs">Bloquear</span>
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => setDeleteUserId(user.id)}
                        size="sm"
                        className="border-orange-600 text-orange-700 hover:bg-orange-600 hover:text-white flex-1 sm:flex-initial sm:w-auto min-w-[100px]"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        <span className="text-xs">Excluir</span>
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                // Show first, last, current and adjacent pages
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <PaginationEllipsis key={page} />;
                }
                return null;
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
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
