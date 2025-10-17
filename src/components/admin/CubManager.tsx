import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calculator, TrendingUp, Calendar } from "lucide-react";

interface CubValue {
  id: string;
  value: number;
  month: number;
  year: number;
  created_at: string;
}

export function CubManager() {
  const [currentCub, setCurrentCub] = useState<CubValue | null>(null);
  const [history, setHistory] = useState<CubValue[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCubData();
  }, []);

  const loadCubData = async () => {
    const now = new Date();
    const { data: current } = await supabase
      .from("cub_values")
      .select("*")
      .eq("month", now.getMonth() + 1)
      .eq("year", now.getFullYear())
      .maybeSingle();

    setCurrentCub(current);

    const { data: historyData } = await supabase
      .from("cub_values")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(6);

    setHistory(historyData || []);
  };

  const handleUpdateCub = async () => {
    const value = parseFloat(newValue.replace(",", "."));
    
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            CUB Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentCub ? (
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">
                  R$ {currentCub.value.toFixed(2)}
                </span>
                <span className="text-muted-foreground">
                  {monthName(currentCub.month)}/{currentCub.year}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
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
              <Button className="w-full mt-4">
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
          <CardTitle>Histórico (Últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês/Ano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Atualizado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {monthName(item.month)}/{item.year}
                    </TableCell>
                    <TableCell>R$ {item.value.toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(item.created_at), "dd/MM/yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum histórico disponível
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
