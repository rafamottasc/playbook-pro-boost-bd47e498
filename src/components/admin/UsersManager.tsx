import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, Mail, Phone, Ban, Trash2, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface UserWithRole {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp: string;
  avatar_url: string | null;
  created_at: string;
  blocked: boolean;
  roles: string[];
}

export function UsersManager() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at");

      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map((profile) => ({
        ...profile,
        roles: userRoles
          ?.filter((role) => role.user_id === profile.id)
          .map((role) => role.role) || [],
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

  const toggleAdminRole = async (userId: string, currentRoles: string[]) => {
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

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar permissões",
        description: error.message,
        variant: "destructive",
      });
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
      
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao bloquear/desbloquear usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;
      
      toast({ 
        title: "Usuário excluído com sucesso!",
        description: "Todos os dados do usuário foram removidos do sistema."
      });
      
      setDeleteUserId(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
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
            <Card key={user.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback className="text-lg">
                      {user.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{user.full_name}</h3>
                      {user.blocked && (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="h-3 w-3" />
                          Bloqueado
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {user.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <a
                            href={`mailto:${user.email}`}
                            className="flex items-center gap-2 text-muted-foreground hover:text-comarc-green transition-colors"
                          >
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                          </a>
                        </div>
                      )}
                      
                      {user.whatsapp && (
                        <div className="flex items-center gap-2 text-sm">
                          <a
                            href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-muted-foreground hover:text-comarc-green transition-colors"
                          >
                            <Phone className="h-4 w-4" />
                            <span>{user.whatsapp}</span>
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {user.roles.includes("admin") && (
                        <Badge variant="default" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </Badge>
                      )}
                      {user.roles.includes("corretor") && (
                        <Badge variant="secondary" className="gap-1">
                          <User className="h-3 w-3" />
                          Corretor
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    variant={user.roles.includes("admin") ? "destructive" : "default"}
                    onClick={() => toggleAdminRole(user.id, user.roles)}
                    size="sm"
                  >
                    {user.roles.includes("admin")
                      ? "Remover Admin"
                      : "Tornar Admin"}
                  </Button>
                  
                  <Button
                    variant={user.blocked ? "default" : "outline"}
                    onClick={() => toggleBlockUser(user.id, user.blocked)}
                    size="sm"
                  >
                    {user.blocked ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Desbloquear
                      </>
                    ) : (
                      <>
                        <Ban className="mr-2 h-4 w-4" />
                        Bloquear
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteUserId(user.id)}
                    size="sm"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuário permanentemente? 
              Esta ação não pode ser desfeita e todos os dados do usuário serão removidos do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteUserId && deleteUser(deleteUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
