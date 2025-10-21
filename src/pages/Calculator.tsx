import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Save, History, FileText, Calendar, Calculator as CalculatorIcon, HardHat, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentFlow } from "@/hooks/usePaymentFlow";
import { BasicInfoSection } from "@/components/calculator/BasicInfoSection";
import { DownPaymentSection } from "@/components/calculator/DownPaymentSection";
import { AtoSection } from "@/components/calculator/AtoSection";
import { PaymentBlock } from "@/components/calculator/PaymentBlock";
import { FlowSummary } from "@/components/calculator/FlowSummary";
import { generateFlowPDF } from "@/components/calculator/FlowPDF";
import { generateFlowTXT } from "@/components/calculator/FlowTXT";
import { PageTransition } from "@/components/PageTransition";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { parseCurrencyInput, formatCurrencyInput } from "@/lib/utils";
import { migrateProposalData } from "@/lib/proposalMigration";

export default function Calculator() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data, updateField, calculate, setData } = usePaymentFlow();
  const [isSaving, setIsSaving] = useState(false);

  const result = calculate();

  // Monitorar mudanças para recalcular saldo automaticamente
  useEffect(() => {
    if (data.keysPayment?.isSaldoMode) {
      const timer = setTimeout(() => {
        const result = calculate();
        const remaining = data.propertyValue - result.totalPaid + (result.keysPayment?.value || 0);
        
        updateField('keysPayment', {
          ...data.keysPayment,
          type: 'value',
          value: remaining,
          percentage: (remaining / data.propertyValue) * 100,
          isSaldoMode: true
        });
      }, 100); // Debounce de 100ms
      
      return () => clearTimeout(timer);
    }
  }, [
    data.propertyValue,
    data.downPayment,
    data.constructionStartPayment,
    data.monthly,
    data.semiannualReinforcement,
    data.annualReinforcement
  ]);

  // Carregar proposta do histórico via location.state
  useEffect(() => {
    if (location.state?.loadedData) {
      // Migrar dados antigos para novo formato
      const migratedData = migrateProposalData(location.state.loadedData);
      setData(migratedData);
      // Limpar state para não recarregar ao revisitar
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleDownloadPDF = async () => {
    if (!data.clientName || data.clientName.length < 3) {
      toast({
        title: "Nome do cliente obrigatório",
        description: "Por favor, preencha o nome do cliente",
        variant: "destructive",
      });
      return;
    }

    if (data.propertyValue <= 0) {
      toast({
        title: "Valor do imóvel obrigatório",
        description: "Por favor, preencha o valor do imóvel",
        variant: "destructive",
      });
      return;
    }

    const downPaymentValue = data.downPayment.type === 'percentage' && data.downPayment.percentage
      ? (data.downPayment.percentage / 100) * data.propertyValue
      : data.downPayment.value || 0;

    if (downPaymentValue <= 0) {
      toast({
        title: "Entrada obrigatória",
        description: "Por favor, preencha o valor da entrada",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, creci")
        .eq("id", user?.id)
        .single();

      await generateFlowPDF(data, result, profile?.full_name || "Corretor", profile?.creci);

      toast({
        title: "PDF gerado com sucesso!",
        description: "O arquivo foi baixado",
        duration: 3000,
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleDownloadTXT = async () => {
    if (!data.clientName || data.clientName.length < 3) {
      toast({
        title: "Nome do cliente obrigatório",
        description: "Por favor, preencha o nome do cliente",
        variant: "destructive",
      });
      return;
    }

    if (data.propertyValue <= 0) {
      toast({
        title: "Valor do imóvel obrigatório",
        description: "Por favor, preencha o valor do imóvel",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, creci")
        .eq("id", user?.id)
        .single();

      generateFlowTXT(data, result, profile?.full_name || "Corretor", profile?.creci);

      toast({
        title: "TXT gerado com sucesso!",
        description: "Arquivo pronto para compartilhar no WhatsApp",
        duration: 3000,
      });
    } catch (error) {
      console.error("Erro ao gerar TXT:", error);
      toast({
        title: "Erro ao gerar TXT",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleSaveProposal = async () => {
    if (!data.clientName || data.clientName.length < 3) {
      toast({
        title: "Nome do cliente obrigatório",
        description: "Por favor, preencha o nome do cliente",
        variant: "destructive",
      });
      return;
    }

    const downPaymentValue = data.downPayment.type === 'percentage' && data.downPayment.percentage
      ? (data.downPayment.percentage / 100) * data.propertyValue
      : data.downPayment.value || 0;

    if (data.propertyValue <= 0 || downPaymentValue <= 0) {
      toast({
        title: "Dados incompletos",
        description: "Preencha valor do imóvel e entrada",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("payment_flows").insert({
        user_id: user?.id!,
        client_name: data.clientName,
        calculation_data: data as any,
      });

      if (error) throw error;

      toast({
        title: "Proposta salva com sucesso!",
        description: "Você pode encontrá-la no histórico",
        duration: 3000,
      });
    } catch (error) {
      console.error("Erro ao salvar proposta:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatKeysPayment = (value: string) => {
    const amount = parseCurrencyInput(value);
    const calculatedPercentage = data.propertyValue > 0 ? (amount / data.propertyValue) * 100 : 0;
    updateField("keysPayment", {
      ...data.keysPayment,
      value: amount,
      percentage: calculatedPercentage,
      isSaldoMode: false // Desativar modo automático
    });
  };

  const handleKeysTypeChange = (type: 'percentage' | 'value') => {
    updateField("keysPayment", { ...data.keysPayment, type, isSaldoMode: false });
  };

  const handleKeysPercentageChange = (value: string) => {
    const percentage = parseFloat(value) || 0;
    const calculatedValue = (percentage / 100) * data.propertyValue;
    updateField("keysPayment", { 
      ...data.keysPayment, 
      percentage, 
      value: calculatedValue,
      isSaldoMode: false // Desativar modo automático
    });
  };

  const handleCalculateBalance = () => {
    const result = calculate();
    const remaining = data.propertyValue - result.totalPaid + (result.keysPayment?.value || 0);
    
    updateField("keysPayment", {
      type: 'value',
      value: remaining,
      percentage: data.propertyValue > 0 ? (remaining / data.propertyValue) * 100 : 0,
      isSaldoMode: true // Ativar modo saldo automático
    });
    
    toast({
      title: "Saldo calculado!",
      description: `R$ ${remaining.toLocaleString('pt-BR')} (modo automático ativado)`,
      duration: 3000,
    });
  };

  const keysDisplayValue = data.keysPayment?.type === 'percentage' && data.keysPayment.percentage
    ? (data.keysPayment.percentage / 100) * data.propertyValue
    : data.keysPayment?.value || 0;

  const keysDisplayPercentage = data.keysPayment?.type === 'value' && data.keysPayment.value && data.propertyValue > 0
    ? (data.keysPayment.value / data.propertyValue) * 100
    : data.keysPayment?.percentage || 0;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-20">
        <Header />
        
        {/* Content */}
        <div className="container mx-auto px-3 sm:px-4 py-6">
          {/* Page Title and History Button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Calculadora de Fluxo</h1>
              <p className="text-sm text-muted-foreground">
                Simule condições de pagamento
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/calculator/history")}
            >
              <History className="mr-2 h-4 w-4" />
              Histórico
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Form Column */}
            <div className="lg:col-span-2 space-y-4">
              <BasicInfoSection data={data} onChange={updateField} />
              
              {/* Seção de Entrada reorganizada */}
              <AtoSection data={data} onChange={updateField} />
              <DownPaymentSection data={data} onChange={updateField} />
              
              {/* Início da Obra */}
              <Card className="animate-fade-in border-l-4 border-l-primary">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <HardHat className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-base font-semibold">Início da Obra</Label>
                      <p className="text-xs text-muted-foreground">Pagamento no início da construção (opcional)</p>
                    </div>
                  </div>

                  {/* Linha única no desktop */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                    {/* Botões: 3 colunas */}
                    <div className="md:col-span-3 grid grid-cols-2 gap-2">
                      <Button 
                        type="button"
                        size="sm"
                        variant={data.constructionStartPayment?.type === 'percentage' ? 'default' : 'outline'}
                        onClick={() => updateField('constructionStartPayment', { ...data.constructionStartPayment, type: 'percentage' })}
                        className="h-9"
                      >
                        %
                      </Button>
                      <Button 
                        type="button"
                        size="sm"
                        variant={data.constructionStartPayment?.type === 'value' ? 'default' : 'outline'}
                        onClick={() => updateField('constructionStartPayment', { ...data.constructionStartPayment, type: 'value' })}
                        className="h-9"
                      >
                        R$
                      </Button>
                    </div>

      {/* Campo Valor: 5 colunas */}
      <div className="md:col-span-5">
        <Label className="text-xs mb-1">Valor</Label>
        {data.constructionStartPayment?.type === 'percentage' ? (
          <div className="space-y-0.5">
            <Input
              type="number"
              step="0.1"
              placeholder="5"
              value={data.constructionStartPayment.percentage || ""}
              onChange={(e) => {
                const percentage = parseFloat(e.target.value) || 0;
                const calculatedValue = (percentage / 100) * data.propertyValue;
                updateField("constructionStartPayment", { 
                  ...data.constructionStartPayment, 
                  percentage, 
                  value: calculatedValue 
                });
              }}
              className="h-9"
            />
            <div className="h-4 flex items-center">
              {data.propertyValue > 0 && data.constructionStartPayment.percentage && (
                <p className="text-xs text-muted-foreground">
                  = R$ {((data.constructionStartPayment.percentage / 100) * data.propertyValue).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            <Input
              type="text"
              placeholder="R$ 50.000,00"
              value={data.constructionStartPayment?.value ? `R$ ${formatCurrencyInput(data.constructionStartPayment.value)}` : ""}
              onChange={(e) => {
                const amount = parseCurrencyInput(e.target.value);
                const calculatedPercentage = data.propertyValue > 0 ? (amount / data.propertyValue) * 100 : 0;
                updateField("constructionStartPayment", {
                  ...data.constructionStartPayment,
                  value: amount,
                  percentage: calculatedPercentage
                });
              }}
              className="h-9"
            />
            <div className="h-4 flex items-center">
              {data.propertyValue > 0 && data.constructionStartPayment?.value && (
                <p className="text-xs text-muted-foreground">
                  = {((data.constructionStartPayment.value / data.propertyValue) * 100).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        )}
      </div>

                    {/* Data: 4 colunas */}
                    <div className="md:col-span-4">
                      <Label className="text-xs mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        1º Vencimento
                      </Label>
                      <Input
                        type="date"
                        value={data.constructionStartPayment?.firstDueDate || ""}
                        onChange={(e) => updateField("constructionStartPayment", {
                          ...data.constructionStartPayment,
                          firstDueDate: e.target.value
                        })}
                        className="h-9"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <PaymentBlock type="monthly" data={data} onChange={updateField} />
              <PaymentBlock
                type="semiannual"
                data={data}
                onChange={updateField}
              />
              <PaymentBlock type="annual" data={data} onChange={updateField} />

              {/* Chaves */}
              <Card className="animate-fade-in border-l-4 border-l-primary">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-base font-semibold">Pagamento na Entrega das Chaves</Label>
                      <p className="text-xs text-muted-foreground">Valor pago quando receber as chaves (opcional)</p>
                    </div>
                  </div>
                  
                  {data.keysPayment?.isSaldoMode && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                      <span>🔄</span>
                      <span>Modo Saldo Automático</span>
                    </div>
                  )}
                  
                  {/* Linha única no desktop */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                    {/* Botões %/R$: 2 colunas */}
                    <div className="md:col-span-2 grid grid-cols-2 gap-2">
                      <Button 
                        type="button"
                        size="sm"
                        variant={data.keysPayment?.type === 'percentage' ? 'default' : 'outline'}
                        onClick={() => handleKeysTypeChange('percentage')}
                        className="h-9 text-xs"
                      >
                        %
                      </Button>
                      <Button 
                        type="button"
                        size="sm"
                        variant={data.keysPayment?.type === 'value' ? 'default' : 'outline'}
                        onClick={() => handleKeysTypeChange('value')}
                        className="h-9 text-xs"
                      >
                        R$
                      </Button>
                    </div>

                    {/* Campo Valor: 6 colunas */}
                    <div className="md:col-span-6">
                      <Label className="text-xs mb-1">Valor das Chaves</Label>
                      {data.keysPayment?.type === 'percentage' ? (
                        <div>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="10"
                            value={data.keysPayment.percentage || ""}
                            onChange={(e) => handleKeysPercentageChange(e.target.value)}
                            className="h-9"
                          />
                          <div className="h-4 flex items-center">
                            {data.propertyValue > 0 && keysDisplayValue > 0 && (
                              <p className="text-xs text-muted-foreground">
                                = R$ {keysDisplayValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Input
                            type="text"
                            placeholder="R$ 160.000,00"
                            value={data.keysPayment?.value ? `R$ ${formatCurrencyInput(data.keysPayment.value)}` : ""}
                            onChange={(e) => formatKeysPayment(e.target.value)}
                            className="h-9"
                          />
                          <div className="h-4 flex items-center">
                            {data.propertyValue > 0 && keysDisplayValue > 0 && (
                              <p className="text-xs text-muted-foreground">
                                = {keysDisplayPercentage.toFixed(1)}%
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botão Saldo Automático: 4 colunas */}
                    <div className="md:col-span-4">
                      <Label className="text-xs mb-1 block">Saldo Automático</Label>
                      <Button 
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleCalculateBalance}
                        className="h-9 w-full text-xs flex items-center justify-center gap-2"
                        title="Calcular saldo restante automaticamente"
                      >
                        <CalculatorIcon className="h-4 w-4" />
                        Calcular Saldo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Column (Desktop) - Sticky Container */}
            <div className="hidden lg:block">
              <div className="sticky top-20 space-y-4">
                <FlowSummary result={result} propertyValue={data.propertyValue} />
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Button onClick={handleDownloadPDF} className="flex-1" size="lg" variant="outline">
                      <Download className="mr-2 h-5 w-5" />
                      Baixar PDF
                    </Button>
                    <Button onClick={handleDownloadTXT} className="flex-1" size="lg" variant="outline">
                      <FileText className="mr-2 h-5 w-5" />
                      Baixar TXT
                    </Button>
                  </div>
                  <Button
                    onClick={handleSaveProposal}
                    className="w-full"
                    size="lg"
                    disabled={isSaving}
                  >
                    <Save className="mr-2 h-5 w-5" />
                    {isSaving ? "Salvando..." : "Salvar Proposta"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Summary (Mobile) */}
            <div className="lg:hidden space-y-4">
              <FlowSummary result={result} propertyValue={data.propertyValue} />
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Button onClick={handleDownloadPDF} className="flex-1" size="lg" variant="outline">
                    <Download className="mr-2 h-5 w-5" />
                    Baixar PDF
                  </Button>
                  <Button onClick={handleDownloadTXT} className="flex-1" size="lg" variant="outline">
                    <FileText className="mr-2 h-5 w-5" />
                    Baixar TXT
                  </Button>
                </div>
                <Button
                  onClick={handleSaveProposal}
                  className="w-full"
                  size="lg"
                  disabled={isSaving}
                >
                  <Save className="mr-2 h-5 w-5" />
                  {isSaving ? "Salvando..." : "Salvar Proposta"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
