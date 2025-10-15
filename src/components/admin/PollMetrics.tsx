import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Download, Users, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Poll {
  id: string;
  title: string;
  results_cache: Record<string, { votes: number; percentage: number }> | null;
}

interface PollMetricsProps {
  poll: Poll;
  isOpen: boolean;
  onClose: () => void;
}

interface PollOption {
  id: string;
  option_text: string;
}

interface Response {
  id: string;
  created_at: string;
  user_id: string;
  option_id: string;
  profiles: {
    full_name: string;
  };
  poll_options: {
    option_text: string;
  };
}

export function PollMetrics({ poll, isOpen, onClose }: PollMetricsProps) {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [options, setOptions] = useState<PollOption[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [activeTab, setActiveTab] = useState("aggregate");

  useEffect(() => {
    if (isOpen && poll) {
      fetchPollData();
    }
  }, [isOpen, poll]);

  useEffect(() => {
    if (activeTab === "individual" && responses.length === 0 && isAdmin) {
      fetchIndividualResponses();
    }
  }, [activeTab, isAdmin]);

  const fetchPollData = async () => {
    // Buscar opções
    const { data: optionsData } = await supabase
      .from("poll_options")
      .select("id, option_text")
      .eq("poll_id", poll.id)
      .order("display_order");

    if (optionsData) {
      setOptions(optionsData);
    }

    // Buscar total de votantes únicos
    const { data: responsesData } = await supabase
      .from("poll_responses")
      .select("user_id")
      .eq("poll_id", poll.id);

    if (responsesData) {
      const uniqueVoters = new Set(responsesData.map(r => r.user_id));
      setTotalVoters(uniqueVoters.size);
    }
  };

  const fetchIndividualResponses = async () => {
    setIsLoadingResponses(true);
    const { data, error } = await supabase
      .from("poll_responses")
      .select(`
        id,
        created_at,
        user_id,
        option_id,
        profiles(full_name),
        poll_options(option_text)
      `)
      .eq("poll_id", poll.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar respostas:", error);
      toast({
        title: "Erro ao carregar respostas",
        description: "Você não tem permissão para visualizar respostas individuais.",
        variant: "destructive"
      });
    } else if (data) {
      setResponses(data as any);
    }
    setIsLoadingResponses(false);
  };

  const getChartData = () => {
    return options.map(option => {
      const result = poll.results_cache?.[option.id] || { votes: 0, percentage: 0 };
      return {
        name: option.option_text,
        votos: result.votes,
        percentual: result.percentage,
      };
    });
  };

  const exportToCSV = () => {
    if (responses.length === 0) {
      fetchIndividualResponses().then(() => {
        generateCSV();
      });
    } else {
      generateCSV();
    }
  };

  const generateCSV = () => {
    const headers = ["Nome", "Opção", "Data/Hora"];
    const rows = responses.map(r => [
      r.profiles?.full_name || "Usuário desconhecido",
      r.poll_options?.option_text || "Opção desconhecida",
      format(new Date(r.created_at), "dd/MM/yyyy HH:mm"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `enquete_${poll.id}_${Date.now()}.csv`;
    link.click();
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Métricas: {poll.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="aggregate">Resultados Agregados</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="individual">
                Respostas Individuais
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="aggregate" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border rounded-lg p-3 sm:p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm truncate">Total de Votantes</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{totalVoters}</p>
              </div>
              <div className="border rounded-lg p-3 sm:p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm truncate">Opção Mais Votada</span>
                </div>
                <p className="text-sm sm:text-lg font-semibold line-clamp-2">
                  {options.length > 0 && poll.results_cache
                    ? options.reduce((max, opt) => {
                        const current = poll.results_cache?.[opt.id]?.votes || 0;
                        const maxVotes = poll.results_cache?.[max.id]?.votes || 0;
                        return current > maxVotes ? opt : max;
                      }).option_text
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold mb-4 text-sm sm:text-base">Distribuição de Votos</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="votos" fill="hsl(var(--primary))">
                    {getChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm sm:text-base">Detalhamento por Opção</h3>
              {options.map((option) => {
                const result = poll.results_cache?.[option.id] || { votes: 0, percentage: 0 };
                return (
                  <div key={option.id} className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-sm">
                      <span className="font-medium break-words">{option.option_text}</span>
                      <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm">
                        <span className="text-muted-foreground whitespace-nowrap">
                          {result.votes} {result.votes === 1 ? "voto" : "votos"}
                        </span>
                        <span className="font-semibold">{result.percentage}%</span>
                      </div>
                    </div>
                    <Progress value={result.percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="individual" className="space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Lista completa de respostas individuais (visível apenas para administradores)
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={isLoadingResponses}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>

            {isLoadingResponses ? (
              <div className="text-center py-12 text-muted-foreground">
                Carregando respostas...
              </div>
            ) : responses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma resposta registrada ainda.
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Usuário</TableHead>
                      <TableHead className="min-w-[150px]">Opção Selecionada</TableHead>
                      <TableHead className="min-w-[120px]">Data/Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell className="text-xs sm:text-sm">
                          {response.profiles?.full_name || "Usuário desconhecido"}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {response.poll_options?.option_text || "Opção desconhecida"}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                          {format(new Date(response.created_at), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
