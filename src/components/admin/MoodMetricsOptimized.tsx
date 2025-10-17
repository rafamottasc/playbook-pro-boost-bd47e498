import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface MoodSummary {
  totalUsers: number;
  participationToday: number;
  averageMood: number;
  difficultCount: number;
  moodDistribution: Record<string, number>;
  teamMoods: Array<{ team: string; averageMood: number }>;
}

interface MoodData {
  user_id: string;
  mood: string;
  date: string;
  team: string | null;
  created_at: string;
  full_name: string;
}

const moodLabels: Record<string, string> = {
  otimo: "Ótimo",
  bem: "Bem",
  neutro: "Neutro",
  cansado: "Cansado",
  dificil: "Difícil",
};

// Mapeamento de moods do banco (português) para variantes do componente (inglês)
const moodVariantMap: Record<string, string> = {
  'otimo': 'great',
  'bem': 'good',
  'neutro': 'okay',
  'cansado': 'bad',
  'dificil': 'terrible',
};

// Cores rotativas para times (verde, azul, laranja)
const teamColors = ['great', 'good', 'bad'] as const;


const MoodMetricsOptimized = React.memo(() => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [recordsPerPage, setRecordsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [users, setUsers] = useState<Array<{ id: string; full_name: string }>>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  
  const [summary, setSummary] = useState<MoodSummary>({
    totalUsers: 0,
    participationToday: 0,
    averageMood: 0,
    difficultCount: 0,
    moodDistribution: {},
    teamMoods: [],
  });
  const [recentMoods, setRecentMoods] = useState<MoodData[]>([]);

  useEffect(() => {
    loadUsers();
    loadTeams();
  }, []);

  useEffect(() => {
    loadMoodData();
  }, [period, recordsPerPage, currentPage, selectedUserId, selectedTeam]);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('approved', true)
      .order('full_name');
    
    if (data) setUsers(data);
  };

  const loadTeams = async () => {
    const { data } = await supabase
      .from('daily_mood')
      .select('team')
      .not('team', 'is', null)
      .order('team');
    
    if (data) {
      const uniqueTeams = [...new Set(data.map(d => d.team).filter(Boolean))];
      setTeams(uniqueTeams as string[]);
    }
  };

  const loadMoodData = async () => {
    try {
      setLoading(true);
      
      const offset = (currentPage - 1) * recordsPerPage;
      
      // Call the optimized server-side function
      const { data, error } = await supabase.rpc('get_mood_metrics', {
        days_period: parseInt(period),
        limit_records: recordsPerPage,
        offset_records: offset,
        filter_user_id: selectedUserId,
        filter_team: selectedTeam
      });

      if (error) throw error;

      if (data) {
        const result = data as any; // Type assertion for RPC return
        setSummary(result.summary);
        setRecentMoods(result.recentMoods || []);
        setTotalRecords(result.totalRecords || 0);
      }
    } catch (error) {
      console.error("Error loading mood data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Clima Organizacional</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px] text-foreground">
            <SelectValue placeholder="Período" className="text-foreground" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participação Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.participationToday}</div>
            <p className="text-xs text-muted-foreground">
              de {summary.totalUsers} usuários
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clima Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averageMood.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">de 5.00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{summary.difficultCount}</div>
            <p className="text-xs text-muted-foreground">climas difíceis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalUsers}</div>
            <p className="text-xs text-muted-foreground">usuários aprovados</p>
          </CardContent>
        </Card>
      </div>

      {/* Mood Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Clima</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(summary.moodDistribution).map(([mood, count]) => {
            const percentage = (count / totalRecords) * 100;
            return (
              <div key={mood} className="space-y-2">
                <div className="flex items-center justify-end">
                  <span className="text-sm font-medium">
                    {moodLabels[mood] || mood}: {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={percentage} variant={moodVariantMap[mood] as any} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Team Comparison */}
      {summary.teamMoods && summary.teamMoods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparação por Time</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // Calcular total de votos de todas as equipes
              const totalVotes = summary.teamMoods.reduce((acc: number, team: any) => acc + (team.voteCount || 0), 0);
              
              return (
                <div className="space-y-4">
                  {summary.teamMoods.map((teamMood: any, index: number) => {
                    const percentage = totalVotes > 0 ? (teamMood.voteCount / totalVotes) * 100 : 0;
                    
                    return (
                      <div key={teamMood.team} className="space-y-2">
                        <div className="flex items-center justify-end">
                          <span className="text-sm font-medium">
                            {teamMood.team}: {teamMood.voteCount} votos ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress 
                          value={percentage} 
                          variant={teamColors[index % teamColors.length]} 
                          className="h-2" 
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Recent Moods Table */}
      <Card>
        <CardHeader className="flex flex-col space-y-4">
          <CardTitle>Registros Recentes</CardTitle>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Filtro por Corretor */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Corretor:</span>
              <Select
                value={selectedUserId || "all"}
                onValueChange={(value) => {
                  setSelectedUserId(value === "all" ? null : value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[200px] text-foreground">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os corretores</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Equipe */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Equipe:</span>
              <Select
                value={selectedTeam || "all"}
                onValueChange={(value) => {
                  setSelectedTeam(value === "all" ? null : value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] text-foreground">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as equipes</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Exibir */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">Exibir:</span>
              <Select
                value={recordsPerPage.toString()}
                onValueChange={(value) => {
                  setRecordsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[100px] text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Clima</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMoods.map((mood, index) => (
                <TableRow key={`${mood.user_id}-${mood.created_at}-${index}`}>
                  <TableCell>{mood.full_name || "Usuário Desconhecido"}</TableCell>
                  <TableCell>
                    <Badge variant={`mood-${moodVariantMap[mood.mood] || 'okay'}` as any}>
                      {moodLabels[mood.mood] || mood.mood}
                    </Badge>
                  </TableCell>
                  <TableCell>{mood.team || "-"}</TableCell>
                  <TableCell>{format(new Date(mood.created_at), "dd/MM/yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      const distance = Math.abs(page - currentPage);
                      return distance === 0 || distance === 1 || page === 1 || page === totalPages;
                    })
                    .map((page, index, array) => {
                      if (index > 0 && array[index - 1] !== page - 1) {
                        return (
                          <React.Fragment key={`ellipsis-${page}`}>
                            <PaginationItem>
                              <span className="px-3">...</span>
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          </React.Fragment>
                        );
                      }
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
                    })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

MoodMetricsOptimized.displayName = "MoodMetricsOptimized";

export default MoodMetricsOptimized;