import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calculator, TrendingUp, Calendar, Info } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CubValue {
  id: string;
  value: number;
  month: number;
  year: number;
  created_at: string;
  variacao_mensal?: number | null;
  acumulado_ano?: number | null;
}

interface ChartDataPoint {
  month: string;
  monthFull: string;
  valor: number;
  variacao: number;
  acumulado: number;
}

export function CubManager() {
  const [currentCub, setCurrentCub] = useState<CubValue | null>(null);
  const [history, setHistory] = useState<CubValue[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadCubData();
    loadAvailableYears();
  }, []);

  useEffect(() => {
    loadHistoryByYear(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    if (history.length > 0) {
      const data = [...history]
        .reverse()
        .map(item => ({
          month: `${monthName(item.month).slice(0, 3)}/${item.year}`,
          monthFull: `${monthName(item.month)}/${item.year}`,
          valor: item.value,
          variacao: item.variacao_mensal || 0,
          acumulado: item.acumulado_ano || 0
        }));
      setChartData(data);
    }
  }, [history]);

  const loadCubData = async () => {
    const now = new Date();
    const { data: current } = await supabase
      .from("cub_values")
      .select("*")
      .eq("month", now.getMonth() + 1)
      .eq("year", now.getFullYear())
      .maybeSingle();

    setCurrentCub(current);
  };

  const loadAvailableYears = async () => {
    const { data } = await supabase
      .from("cub_values")
      .select("year")
      .order("year", { ascending: false });
    
    if (data) {
      const years = [...new Set(data.map(item => item.year))];
      setAvailableYears(years);
    }
  };

  const loadHistoryByYear = async (year: number) => {
    const { data } = await supabase
      .from("cub_values")
      .select("*")
      .eq("year", year)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(12);
    
    setHistory(data || []);
  };

  const handleUpdateCub = async () => {
    // Remove pontos (separador de milhar) e converte vírgula em ponto (decimal)
    const cleanValue = newValue.replace(/\./g, "").replace(",", ".");
    const value = parseFloat(cleanValue);
    
    if (isNaN(value) || value <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor válido para o CUB",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("cub_values")
        .upsert({ 
          month, 
          year, 
          value,
          updated_by: userData.user?.id 
        }, {
          onConflict: 'month,year'
        });

      if (error) throw error;

      toast({
        title: "CUB atualizado!",
        description: `Valor de R$ ${value.toFixed(2)} cadastrado para ${format(now, "MMMM/yyyy", { locale: ptBR })}`,
      });

      loadCubData();
      setIsDialogOpen(false);
      setNewValue("");
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao atualizar CUB",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const monthName = (month: number) => 
    format(new Date(2025, month - 1, 1), "MMMM", { locale: ptBR });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gerenciar CUB/SC</h2>
        <p className="text-muted-foreground">
          Cadastre o valor mensal do CUB/SC para cálculos da calculadora
        </p>
      </div>

      {/* Banner Explicativo */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                O que é o CUB/m² (Custo Unitário Básico de Construção)
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                O CUB/m² é um índice calculado mensalmente pelos Sindicatos da Indústria 
                da Construção (Sinduscons), conforme a NBR 12.721/2006 da ABNT e a Lei 
                4.591/1964. Ele indica o custo médio por metro quadrado de construção de 
                edificações padrão e serve como referência oficial para{" "}
                <strong>orçamentos, contratos, reajustes de obras e avaliações imobiliárias</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              CUB Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentCub ? (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <span className="text-4xl md:text-5xl font-semibold leading-tight text-primary whitespace-nowrap">
                    R$&nbsp;{formatCurrency(currentCub.value)}
                  </span>
                  <span className="text-sm md:text-base text-muted-foreground">
                    {monthName(currentCub.month)}/{currentCub.year}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded-lg p-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                      Variação Mensal
                    </p>
                    <p className={cn(
                      "text-base md:text-lg font-semibold tabular-nums",
                      (currentCub.variacao_mensal || 0) >= 0 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {currentCub.variacao_mensal != null
                        ? `${currentCub.variacao_mensal > 0 ? '+' : ''}${currentCub.variacao_mensal.toFixed(2)}%`
                        : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                      Acumulado no Ano
                    </p>
                    <p className={cn(
                      "text-base md:text-lg font-semibold tabular-nums",
                      (currentCub.acumulado_ano || 0) >= 0 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {currentCub.acumulado_ano != null
                        ? `${currentCub.acumulado_ano > 0 ? '+' : ''}${currentCub.acumulado_ano.toFixed(2)}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground pt-1">
                  Última atualização: {format(new Date(currentCub.created_at), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  Nenhum valor cadastrado para o mês atual
                </p>
              </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-full mt-4">
                  <Calendar className="mr-2 h-4 w-4" />
                  {currentCub ? "Atualizar CUB" : "Cadastrar CUB"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    CUB/SC - {format(new Date(), "MMMM/yyyy", { locale: ptBR })}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">Valor do CUB/SC</label>
                    <Input
                      type="text"
                      placeholder="2847,50"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Formato: 2847,50 (use vírgula para decimais)
                    </p>
                  </div>
                  <Button 
                    onClick={handleUpdateCub} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Salvando..." : "Confirmar Atualização"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-3">
              <span>Histórico (Últimos 12 Meses)</span>
              {availableYears.length > 0 && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Ano:</Label>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="min-w-[720px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">Mês/Ano</TableHead>
                        <TableHead className="text-right w-[140px]">Valor (R$/m²)</TableHead>
                        <TableHead className="text-right w-[120px]">Var. Mensal</TableHead>
                        <TableHead className="text-right w-[120px]">Acum. Ano</TableHead>
                        <TableHead className="text-right w-[140px]">Atualizado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {monthName(item.month)}/{item.year}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums whitespace-nowrap">
                            R$&nbsp;{formatCurrency(item.value)}
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-medium tabular-nums whitespace-nowrap",
                            (item.variacao_mensal || 0) >= 0 
                              ? "text-green-600 dark:text-green-400" 
                              : "text-red-600 dark:text-red-400"
                          )}>
                            {item.variacao_mensal != null
                              ? `${item.variacao_mensal > 0 ? '+' : ''}${item.variacao_mensal.toFixed(2)}%`
                              : '-'}
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-medium tabular-nums whitespace-nowrap",
                            (item.acumulado_ano || 0) >= 0 
                              ? "text-green-600 dark:text-green-400" 
                              : "text-red-600 dark:text-red-400"
                          )}>
                            {item.acumulado_ano != null
                              ? `${item.acumulado_ano > 0 ? '+' : ''}${item.acumulado_ano.toFixed(2)}%`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs whitespace-nowrap">
                            {format(new Date(item.created_at), "dd/MM/yy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum histórico disponível para {selectedYear}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução do CUB/m² - {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[500px]">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      domain={['dataMin - 50', 'dataMax + 50']}
                      tickFormatter={(value) => `R$\u00A0${formatCurrency(value)}`}
                      width={85}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload as ChartDataPoint;
                        return (
                          <div className="bg-background border border-border rounded-lg shadow-lg p-3 space-y-1">
                            <p className="font-semibold text-sm">{data.monthFull}</p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Valor:</span>{' '}
                              <span className="font-semibold whitespace-nowrap">
                                R$&nbsp;{formatCurrency(data.valor)}
                              </span>
                            </p>
                            <p className={cn(
                              "text-sm",
                              data.variacao >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            )}>
                              <span className="text-muted-foreground">Var. Mensal:</span>{' '}
                              <span className="font-semibold">
                                {data.variacao > 0 ? '+' : ''}{data.variacao.toFixed(2)}%
                              </span>
                            </p>
                            <p className={cn(
                              "text-sm",
                              data.acumulado >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            )}>
                              <span className="text-muted-foreground">Acum. Ano:</span>{' '}
                              <span className="font-semibold">
                                {data.acumulado > 0 ? '+' : ''}{data.acumulado.toFixed(2)}%
                              </span>
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="valor" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
