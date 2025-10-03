import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserWithRole {
  id: string;
  full_name: string;
  whatsapp: string;
  avatar_url: string | null;
  created_at: string;
  roles: string[];
}

export function UsersManager() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Gerenciar Usuários</h2>
      
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.avatar_url || ""} />
                  <AvatarFallback>
                    {user.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{user.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{user.whatsapp}</p>
                  <div className="flex gap-2 mt-1">
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
              <Button
                variant={user.roles.includes("admin") ? "destructive" : "default"}
                onClick={() => toggleAdminRole(user.id, user.roles)}
              >
                {user.roles.includes("admin")
                  ? "Remover Admin"
                  : "Tornar Admin"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
