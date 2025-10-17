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
  great: "Ótimo",
  good: "Bom",
  okay: "Normal",
  bad: "Ruim",
  terrible: "Péssimo",
};

// Mapeamento de moods do banco (português) para variantes do componente (inglês)
const moodVariantMap: Record<string, string> = {
  'otimo': 'great',
  'great': 'great',
  'bem': 'good',
  'good': 'good',
  'neutro': 'okay',
  'normal': 'okay',
  'okay': 'okay',
  'cansado': 'bad',
  'ruim': 'bad',
  'bad': 'bad',
  'pessimo': 'terrible',
  'terrible': 'terrible',
};


const MoodMetricsOptimized = React.memo(() => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [recordsPerPage, setRecordsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
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
    loadMoodData();
  }, [period, recordsPerPage, currentPage]);

  const loadMoodData = async () => {
    try {
      setLoading(true);
      
      const offset = (currentPage - 1) * recordsPerPage;
      
      // Call the optimized server-side function
      const { data, error } = await supabase.rpc('get_mood_metrics', {
        days_period: parseInt(period),
        limit_records: recordsPerPage,
        offset_records: offset
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
            <SelectValue placeholder="Período" />
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
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{moodLabels[mood]}</span>
                  <span className="text-sm text-muted-foreground">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={percentage} variant={moodVariantMap[mood] as any} className="h-3" />
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
            <div className="space-y-4">
              {summary.teamMoods.map((teamMood) => (
                <div key={teamMood.team} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{teamMood.team}</span>
                    <span className="text-sm font-bold">
                      {teamMood.averageMood.toFixed(2)}
                    </span>
                  </div>
                  <Progress value={(teamMood.averageMood / 5) * 100} variant="default" className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Moods Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Registros Recentes</CardTitle>
          <div className="flex items-center gap-2">
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
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
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