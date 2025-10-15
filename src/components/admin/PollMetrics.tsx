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
  const [options, setOptions] = useState<PollOption[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);

  useEffect(() => {
    if (isOpen && poll) {
      fetchPollData();
    }
  }, [isOpen, poll]);

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
    const { data } = await supabase
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

    if (data) {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Métricas: {poll.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="aggregate" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="aggregate">Resultados Agregados</TabsTrigger>
            <TabsTrigger 
              value="individual" 
              onClick={() => {
                if (responses.length === 0) {
                  fetchIndividualResponses();
                }
              }}
            >
              Respostas Individuais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aggregate" className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Total de Votantes</span>
                </div>
                <p className="text-3xl font-bold">{totalVoters}</p>
              </div>
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Opção Mais Votada</span>
                </div>
                <p className="text-lg font-semibold">
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

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Distribuição de Votos</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
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
              <h3 className="font-semibold">Detalhamento por Opção</h3>
              {options.map((option) => {
                const result = poll.results_cache?.[option.id] || { votes: 0, percentage: 0 };
                return (
                  <div key={option.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{option.option_text}</span>
                      <div className="flex gap-4">
                        <span className="text-muted-foreground">
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
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Lista completa de respostas individuais (visível apenas para administradores)
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={isLoadingResponses}
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
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Opção Selecionada</TableHead>
                      <TableHead>Data/Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell>{response.profiles?.full_name || "Usuário desconhecido"}</TableCell>
                        <TableCell>{response.poll_options?.option_text || "Opção desconhecida"}</TableCell>
                        <TableCell>
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
