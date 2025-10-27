import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Users2, Trash2, Plus, AlertCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Team {
  id: string;
  name: string;
  active: boolean;
  display_order: number;
  created_at: string;
}

export function TeamsManager() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast({
        title: "Erro ao carregar equipes",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTeams(data || []);
    }
    setLoading(false);
  };

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Insira um nome para a equipe",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("teams")
      .insert({
        name: newTeamName.trim(),
        display_order: teams.length + 1,
      });

    if (error) {
      toast({
        title: "Erro ao criar equipe",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Equipe criada!",
        description: `${newTeamName} foi adicionada com sucesso.`,
      });
      setNewTeamName("");
      loadTeams();
    }

    setSubmitting(false);
  };

  const handleToggleActive = async (teamId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("teams")
      .update({ active: !currentActive })
      .eq("id", teamId);

    if (error) {
      toast({
        title: "Erro ao atualizar equipe",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: currentActive ? "Equipe desativada" : "Equipe ativada",
        description: currentActive 
          ? "A equipe não aparecerá mais na seleção, mas usuários vinculados mantêm seus dados."
          : "A equipe está ativa novamente.",
      });
      loadTeams();
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId);

    if (error) {
      toast({
        title: "Erro ao excluir equipe",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Equipe excluída",
        description: "A equipe foi removida permanentemente.",
      });
      loadTeams();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users2 className="h-5 w-5" />
          Gerenciar Equipes
        </CardTitle>
        <CardDescription>
          Crie ou gerencie as equipes (ou áreas) da sua empresa. Os usuários poderão escolher entre elas em seus perfis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Nome da nova equipe"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTeam()}
            disabled={submitting}
            className="w-full"
          />
          <Button 
            onClick={handleAddTeam} 
            disabled={submitting || !newTeamName.trim()}
            className="whitespace-nowrap w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>

        <Separator />

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando equipes...
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma equipe cadastrada ainda
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{team.name}</p>
                    {!team.active && (
                      <Badge variant="secondary" className="text-xs">
                        Desativada
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(team.id, team.active)}
                  >
                    {team.active ? "Desativar" : "Ativar"}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir equipe?</AlertDialogTitle>
                        <AlertDialogDescription>
                          <div className="space-y-2">
                            <p>Tem certeza que deseja excluir <strong>{team.name}</strong>?</p>
                            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md">
                              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                              <p className="text-sm">
                                <strong>Atenção:</strong> Usuários vinculados a essa equipe terão seus dados mantidos, 
                                mas a equipe não aparecerá mais como opção de seleção.
                              </p>
                            </div>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteTeam(team.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Confirmar Exclusão
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
          <p className="font-medium">ℹ️ Como funciona:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Equipes ativas aparecem na seleção de perfil dos usuários</li>
            <li>Desativar uma equipe a esconde, mas mantém vínculos existentes</li>
            <li>Usuários vinculados a equipes desativadas verão "Equipe desativada" no perfil</li>
            <li>Você pode reativar equipes a qualquer momento</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
