import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Users,
  Smile,
  Meh,
  Frown
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface MoodData {
  user_id: string;
  mood: string;
  date: string;
  team: string | null;
  created_at: string;
  full_name?: string;
}

interface MoodSummary {
  totalUsers: number;
  participationToday: number;
  averageMood: number;
  difficultCount: number;
  moodDistribution: Record<string, number>;
  teamMoods: Record<string, number>;
}

const moodValues = {
  otimo: 5,
  bem: 4,
  neutro: 3,
  cansado: 2,
  dificil: 1,
};

const moodLabels = {
  otimo: "Ótimo",
  bem: "Bem",
  neutro: "Neutro",
  cansado: "Cansado",
  dificil: "Difícil",
};

const moodColors = {
  otimo: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  bem: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300",
  neutro: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  cansado: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  dificil: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export function MoodMetrics() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7");
  const [summary, setSummary] = useState<MoodSummary | null>(null);
  const [recentMoods, setRecentMoods] = useState<MoodData[]>([]);
  const [recordsPerPage, setRecordsPerPage] = useState(15);
  const [currentRecordsPage, setCurrentRecordsPage] = useState(1);

  useEffect(() => {
    loadMoodData();
  }, [period]);

  const loadMoodData = async () => {
    setLoading(true);
    try {
      const daysAgo = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Get mood data
      const { data: moodData, error: moodError } = await supabase
        .from("daily_mood")
        .select("*")
        .gte("date", startDate.toISOString().split('T')[0])
        .order("created_at", { ascending: false });

      if (moodError) throw moodError;

      // Get total approved users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("approved", true);

      // Calculate today's participation
      const today = new Date().toISOString().split('T')[0];
      const todayMoods = moodData?.filter(m => m.date === today) || [];
      const participationToday = totalUsers ? Math.round((todayMoods.length / totalUsers) * 100) : 0;

      // Calculate average mood
      const moodSum = moodData?.reduce((sum, m) => sum + (moodValues[m.mood as keyof typeof moodValues] || 0), 0) || 0;
      const averageMood = moodData?.length ? moodSum / moodData.length : 0;

      // Count difficult moods in last 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const difficultCount = moodData?.filter(
        m => m.mood === 'dificil' && new Date(m.date) >= threeDaysAgo
      ).length || 0;

      // Mood distribution
      const moodDistribution: Record<string, number> = {};
      moodData?.forEach(m => {
        moodDistribution[m.mood] = (moodDistribution[m.mood] || 0) + 1;
      });

      // Team moods (average by team)
      const teamMoodsRaw: Record<string, number[]> = {};
      moodData?.forEach(m => {
        if (m.team) {
          if (!teamMoodsRaw[m.team]) teamMoodsRaw[m.team] = [];
          teamMoodsRaw[m.team].push(moodValues[m.mood as keyof typeof moodValues] || 0);
        }
      });

      const teamMoods: Record<string, number> = {};
      Object.keys(teamMoodsRaw).forEach(team => {
        const avg = teamMoodsRaw[team].reduce((a, b) => a + b, 0) / teamMoodsRaw[team].length;
        teamMoods[team] = avg;
      });

      setSummary({
        totalUsers: totalUsers || 0,
        participationToday,
        averageMood,
        difficultCount,
        moodDistribution,
        teamMoods,
      });

      // Get recent moods with user names
      const userIds = [...new Set(moodData?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      const enrichedMoods = moodData?.map(m => ({
        ...m,
        full_name: profileMap.get(m.user_id) || "Usuário desconhecido",
      })) || [];

      setRecentMoods(enrichedMoods);
      
      // Reset pagination when period changes
      setCurrentRecordsPage(1);
    } catch (error) {
      console.error("Error loading mood data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations for recent moods
  const totalRecordsPages = Math.ceil(recentMoods.length / recordsPerPage);
  const recordsStartIndex = (currentRecordsPage - 1) * recordsPerPage;
  const recordsEndIndex = recordsStartIndex + recordsPerPage;
  const paginatedMoods = recentMoods.slice(recordsStartIndex, recordsEndIndex);

  if (loading) {
    return <div className="text-center py-8">Carregando métricas...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clima Organizacional</h2>
          <p className="text-muted-foreground">
            Acompanhe o humor e bem-estar da equipe
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Participação Hoje
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.participationToday}%</div>
            <p className="text-xs text-muted-foreground">
              dos corretores registraram
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Humor Médio
            </CardTitle>
            {summary && summary.averageMood >= 4 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-orange-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.averageMood.toFixed(1)}/5.0
            </div>
            <p className="text-xs text-muted-foreground">
              {summary && summary.averageMood >= 4 
                ? "Equipe motivada" 
                : summary && summary.averageMood >= 3
                ? "Clima neutro"
                : "Requer atenção"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas (3 dias)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.difficultCount}</div>
            <p className="text-xs text-muted-foreground">
              registros de humor difícil
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              corretores ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mood Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Humor</CardTitle>
          <CardDescription>
            Proporção de cada nível de humor no período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(summary?.moodDistribution || {})
              .sort(([a], [b]) => (moodValues[b as keyof typeof moodValues] || 0) - (moodValues[a as keyof typeof moodValues] || 0))
              .map(([mood, count]) => {
                const total = Object.values(summary?.moodDistribution || {}).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                const Icon = mood === 'otimo' || mood === 'bem' ? Smile : mood === 'neutro' ? Meh : Frown;
                
                return (
                  <div key={mood} className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {moodLabels[mood as keyof typeof moodLabels]}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            mood === 'otimo' ? 'bg-green-600' :
                            mood === 'bem' ? 'bg-lime-500' :
                            mood === 'neutro' ? 'bg-yellow-500' :
                            mood === 'cansado' ? 'bg-orange-500' :
                            'bg-red-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Team Comparison */}
      {Object.keys(summary?.teamMoods || {}).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparação por Equipe</CardTitle>
            <CardDescription>
              Humor médio de cada equipe (escala 1-5)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary?.teamMoods || {})
                .sort(([, a], [, b]) => b - a)
                .map(([team, avg]) => (
                  <div key={team} className="flex items-center gap-3">
                    <div className="w-32 text-sm font-medium truncate">
                      {team}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden flex-1 mr-3">
                          <div
                            className={`h-full ${
                              avg >= 4 ? 'bg-green-600' :
                              avg >= 3 ? 'bg-yellow-500' :
                              'bg-orange-500'
                            }`}
                            style={{ width: `${(avg / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {avg.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Moods Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registros Recentes</CardTitle>
              <CardDescription>
                Histórico individual de humor dos corretores
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mostrar:</span>
              <Select value={recordsPerPage.toString()} onValueChange={(v) => {
                setRecordsPerPage(Number(v));
                setCurrentRecordsPage(1);
              }}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corretor</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead>Humor</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMoods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMoods.map((mood) => (
                  <TableRow key={mood.user_id + mood.date}>
                    <TableCell className="font-medium">{mood.full_name}</TableCell>
                    <TableCell>{mood.team || "-"}</TableCell>
                    <TableCell>
                      <Badge className={moodColors[mood.mood as keyof typeof moodColors]}>
                        {moodLabels[mood.mood as keyof typeof moodLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(mood.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalRecordsPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentRecordsPage(p => Math.max(1, p - 1))}
                      className={currentRecordsPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalRecordsPages)].map((_, i) => {
                    const page = i + 1;
                    if (
                      page === 1 || 
                      page === totalRecordsPages || 
                      (page >= currentRecordsPage - 1 && page <= currentRecordsPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentRecordsPage(page)}
                            isActive={currentRecordsPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentRecordsPage - 2 || page === currentRecordsPage + 2) {
                      return <PaginationEllipsis key={page} />;
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentRecordsPage(p => Math.min(totalRecordsPages, p + 1))}
                      className={currentRecordsPage === totalRecordsPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
}
