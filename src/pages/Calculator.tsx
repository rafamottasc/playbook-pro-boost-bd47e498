import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Download, Save, History, FileText, Calendar, Calculator as CalculatorIcon, HardHat, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentFlow } from "@/hooks/usePaymentFlow";
import { CurrencyConfigSection } from "@/components/calculator/CurrencyConfigSection";
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

// Mapa de nomes dos campos para exibição
const FIELD_NAMES = {
  monthly: "Parcelas Mensais",
  semiannual: "Reforços Semestrais",
  annual: "Reforços Anuais",
  keys: "Pagamento na Entrega das Chaves"
};

export default function Calculator() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data, updateField, calculate, setData } = usePaymentFlow();
  const [isSaving, setIsSaving] = useState(false);

  const result = calculate();

  // Função para verificar se outro campo já está usando auto-cálculo
  const checkOtherAutoCalculate = (currentField: string): string | null => {
    if (currentField !== 'monthly' && data.monthly?.autoCalculate) {
      return FIELD_NAMES.monthly;
    }
    if (currentField !== 'semiannual' && data.semiannualReinforcement?.autoCalculate) {
      return FIELD_NAMES.semiannual;
    }
    if (currentField !== 'annual' && data.annualReinforcement?.autoCalculate) {
      return FIELD_NAMES.annual;
    }
    if (currentField !== 'keys' && data.keysPayment?.isSaldoMode) {
      return FIELD_NAMES.keys;
    }
    return null;
  };

  // Expor função globalmente para o PaymentBlock usar
  useEffect(() => {
    (window as any).checkOtherAutoCalculate = (field: string) => {
      const otherField = checkOtherAutoCalculate(field);
      if (otherField) {
        toast({
          title: "Cálculo automático já ativo",
          description: `O campo "${otherField}" já está usando cálculo automático. Desative-o primeiro para usar em outro campo.`,
          variant: "destructive",
          duration: 4000,
        });
        return true;
      }
      return false;
    };

    return () => {
      delete (window as any).checkOtherAutoCalculate;
    };
  }, [data.monthly?.autoCalculate, data.semiannualReinforcement?.autoCalculate, data.annualReinforcement?.autoCalculate, data.keysPayment?.isSaldoMode, toast]);

  // Monitorar mudanças para recalcular saldo automaticamente (chaves)
  useEffect(() => {
    if (isSaving) return; // ✅ Não calcular durante salvamento
    
    if (data.keysPayment?.isSaldoMode) {
      // Validação: Verificar se valor do imóvel é válido
      if (!data.propertyValue || data.propertyValue <= 0) {
        console.warn('Valor do imóvel inválido para cálculo automático das chaves');
        return;
      }

      const timer = setTimeout(() => {
        const result = calculate();
        
        // Calcular saldo restante EXCLUINDO o valor atual das chaves
        const totalWithoutKeys = result.totalPaid - (result.keysPayment?.value || 0);
        const remaining = data.propertyValue - totalWithoutKeys;
        
        // Validação: Prevenir valores negativos
        if (remaining < 0) {
          toast({
            title: "Atenção",
            description: "Os pagamentos já excedem o valor do imóvel. Ajuste os valores.",
            variant: "destructive",
          });
          return;
        }
        
        updateField('keysPayment', {
          ...data.keysPayment,
          type: 'value',
          value: remaining,
          percentage: data.propertyValue > 0 ? (remaining / data.propertyValue) * 100 : 0,
          isSaldoMode: true
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [
    isSaving,
    data.propertyValue,
    data.downPayment,
    data.constructionStartPayment,
    data.monthly,
    data.semiannualReinforcement,
    data.annualReinforcement,
    data.keysPayment?.isSaldoMode
  ]);

  // Monitorar mudanças para recalcular reforços semestrais automaticamente
  useEffect(() => {
    if (isSaving) return; // ✅ Não calcular durante salvamento
    
    if (data.semiannualReinforcement?.enabled && 
        data.semiannualReinforcement?.autoCalculate && 
        data.semiannualReinforcement?.count) {
      
      // Validação: Verificar se valor do imóvel e count são válidos
      if (!data.propertyValue || data.propertyValue <= 0) {
        console.warn('Valor do imóvel inválido para cálculo automático semestral');
        return;
      }
      
      if (data.semiannualReinforcement.count <= 0) {
        console.warn('Número de reforços semestrais deve ser maior que zero');
        return;
      }

      const timer = setTimeout(() => {
        const result = calculate();
        
        // Calcular saldo restante EXCLUINDO o valor atual dos reforços semestrais
        const totalWithoutSemiannual = result.totalPaid - (result.semiannualReinforcement?.total || 0);
        const remaining = data.propertyValue - totalWithoutSemiannual;
        
        // Validação: Prevenir cálculo com saldo negativo
        if (remaining <= 0) {
          toast({
            title: "Atenção nos Reforços Semestrais",
            description: "Os outros pagamentos já cobrem o valor total. Desative o cálculo automático ou ajuste os valores.",
            variant: "destructive",
          });
          updateField('semiannualReinforcement', {
            ...data.semiannualReinforcement,
            autoCalculate: false
          });
          return;
        }
        
        // Dividir pelo número de reforços
        const valuePerReinforcement = remaining / data.semiannualReinforcement.count;
        
        updateField('semiannualReinforcement', {
          ...data.semiannualReinforcement,
          type: 'value',
          value: valuePerReinforcement,
          percentage: data.propertyValue > 0 ? (valuePerReinforcement / data.propertyValue) * 100 : 0,
          autoCalculate: true
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [
    isSaving,
    data.propertyValue,
    data.downPayment,
    data.constructionStartPayment,
    data.monthly,
    data.semiannualReinforcement?.count,
    data.semiannualReinforcement?.enabled,
    data.semiannualReinforcement?.autoCalculate,
    data.annualReinforcement,
    data.keysPayment
  ]);

  // Monitorar mudanças para recalcular reforços anuais automaticamente
  useEffect(() => {
    if (isSaving) return; // ✅ Não calcular durante salvamento
    
    if (data.annualReinforcement?.enabled && 
        data.annualReinforcement?.autoCalculate && 
        data.annualReinforcement?.count) {
      
      // Validação: Verificar se valor do imóvel e count são válidos
      if (!data.propertyValue || data.propertyValue <= 0) {
        console.warn('Valor do imóvel inválido para cálculo automático anual');
        return;
      }
      
      if (data.annualReinforcement.count <= 0) {
        console.warn('Número de reforços anuais deve ser maior que zero');
        return;
      }

      const timer = setTimeout(() => {
        const result = calculate();
        
        // Calcular saldo restante EXCLUINDO o valor atual dos reforços anuais
        const totalWithoutAnnual = result.totalPaid - (result.annualReinforcement?.total || 0);
        const remaining = data.propertyValue - totalWithoutAnnual;
        
        // Validação: Prevenir cálculo com saldo negativo
        if (remaining <= 0) {
          toast({
            title: "Atenção nos Reforços Anuais",
            description: "Os outros pagamentos já cobrem o valor total. Desative o cálculo automático ou ajuste os valores.",
            variant: "destructive",
          });
          updateField('annualReinforcement', {
            ...data.annualReinforcement,
            autoCalculate: false
          });
          return;
        }
        
        // Dividir pelo número de reforços
        const valuePerReinforcement = remaining / data.annualReinforcement.count;
        
        updateField('annualReinforcement', {
          ...data.annualReinforcement,
          type: 'value',
          value: valuePerReinforcement,
          percentage: data.propertyValue > 0 ? (valuePerReinforcement / data.propertyValue) * 100 : 0,
          autoCalculate: true
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [
    isSaving,
    data.propertyValue,
    data.downPayment,
    data.constructionStartPayment,
    data.monthly,
    data.annualReinforcement?.count,
    data.annualReinforcement?.enabled,
    data.annualReinforcement?.autoCalculate,
    data.semiannualReinforcement,
    data.keysPayment
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

    // Validar se não excede o valor do imóvel
    if (result.exceedsLimit) {
      toast({
        title: "Valores excedem o limite!",
        description: `O total calculado ultrapassa o valor do imóvel. Ajuste os valores antes de gerar o PDF.`,
        variant: "destructive",
      });
      return;
    }

    const downPaymentValue = data.downPayment.type === 'percentage' && data.downPayment.percentage
      ? (data.downPayment.percentage / 100) * data.propertyValue
      : data.downPayment.value || 0;

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

    // Validar se não excede o valor do imóvel
    if (result.exceedsLimit) {
      toast({
        title: "Valores excedem o limite!",
        description: `O total calculado ultrapassa o valor do imóvel. Ajuste os valores antes de gerar o TXT.`,
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

    if (!data.propertyValue || data.propertyValue <= 0) {
      toast({
        title: "Valor do imóvel obrigatório",
        description: "Por favor, preencha o valor total do imóvel",
        variant: "destructive",
      });
      return;
    }

    // Validar se não excede o valor do imóvel
    if (result.exceedsLimit) {
      toast({
        title: "Valores excedem o limite!",
        description: `O total calculado ultrapassa o valor do imóvel em R$ ${(result.exceededAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Ajuste os valores antes de salvar.`,
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
    const current = data.keysPayment || { type: 'percentage' };
    
    if (type === 'percentage' && current.value) {
      // Converter R$ → %
      const percentage = data.propertyValue > 0 
        ? (current.value / data.propertyValue) * 100 
        : 0;
      updateField("keysPayment", { 
        ...current, 
        type: 'percentage', 
        percentage, 
        value: current.value,
        isSaldoMode: false 
      });
    } else if (type === 'value' && current.percentage) {
      // Converter % → R$
      const value = (current.percentage / 100) * data.propertyValue;
      updateField("keysPayment", { 
        ...current, 
        type: 'value', 
        value, 
        percentage: current.percentage,
        isSaldoMode: false 
      });
    } else {
      updateField("keysPayment", { ...current, type, isSaldoMode: false });
    }
  };

  const handleKeysPercentageChange = (value: string) => {
    const percentage = parseFloat(value) || 0;
    
    // Auto-switch: se valor > 100, converter para R$ (ninguém dá mais de 100%)
    if (percentage > 100) {
      const amount = percentage; // O número digitado é o valor em R$
      const calculatedPercentage = data.propertyValue > 0 ? (amount / data.propertyValue) * 100 : 0;
      updateField("keysPayment", { 
        ...data.keysPayment, 
        type: 'value',
        value: amount,
        percentage: calculatedPercentage,
        isSaldoMode: false
      });
      return;
    }
    
    const calculatedValue = (percentage / 100) * data.propertyValue;
    updateField("keysPayment", { 
      ...data.keysPayment, 
      percentage, 
      value: calculatedValue,
      isSaldoMode: false // Desativar modo automático
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
              <CurrencyConfigSection data={data} onChange={updateField} />
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
                      <Label className="text-lg font-semibold">Início da Obra</Label>
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
                        variant={(data.constructionStartPayment?.type === 'percentage' || !data.constructionStartPayment?.type) ? 'default' : 'outline'}
                        onClick={() => {
                          const current = data.constructionStartPayment || { type: 'percentage' };
                          if (current.value) {
                            // Converter R$ → %
                            const percentage = data.propertyValue > 0 
                              ? (current.value / data.propertyValue) * 100 
                              : 0;
                            updateField('constructionStartPayment', { 
                              ...current, 
                              type: 'percentage', 
                              percentage, 
                              value: current.value 
                            });
                          } else {
                            updateField('constructionStartPayment', { ...current, type: 'percentage' });
                          }
                        }}
                        className="h-9"
                      >
                        %
                      </Button>
                      <Button 
                        type="button"
                        size="sm"
                        variant={data.constructionStartPayment?.type === 'value' ? 'default' : 'outline'}
                        onClick={() => {
                          const current = data.constructionStartPayment || { type: 'value' };
                          if (current.percentage) {
                            // Converter % → R$
                            const value = (current.percentage / 100) * data.propertyValue;
                            updateField('constructionStartPayment', { 
                              ...current, 
                              type: 'value', 
                              value, 
                              percentage: current.percentage 
                            });
                          } else {
                            updateField('constructionStartPayment', { ...current, type: 'value' });
                          }
                        }}
                        className="h-9"
                      >
                        R$
                      </Button>
                    </div>

      {/* Campo Valor: 5 colunas */}
      <div className="md:col-span-5">
        <Label className="text-xs mb-1">Valor</Label>
        {(data.constructionStartPayment?.type === 'percentage' || !data.constructionStartPayment?.type) ? (
          <Input
            type="number"
            step="0.1"
            placeholder="5"
            value={data.constructionStartPayment?.percentage || ""}
            onChange={(e) => {
              const percentage = parseFloat(e.target.value) || 0;
              
              // Auto-switch: se valor > 100, converter para R$ (ninguém dá mais de 100%)
              if (percentage > 100) {
                const amount = percentage; // O número digitado é o valor em R$
                const calculatedPercentage = data.propertyValue > 0 ? (amount / data.propertyValue) * 100 : 0;
                updateField("constructionStartPayment", { 
                  ...data.constructionStartPayment, 
                  type: 'value',
                  value: amount,
                  percentage: calculatedPercentage
                });
                return;
              }
              
              const calculatedValue = (percentage / 100) * data.propertyValue;
              updateField("constructionStartPayment", { 
                ...data.constructionStartPayment, 
                percentage, 
                value: calculatedValue 
              });
            }}
            className="h-9"
          />
        ) : (
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

              <PaymentBlock type="monthly" data={data} onChange={updateField} calculatedValue={result.monthly?.value} />
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
                      <Label className="text-lg font-semibold">Pagamento na Entrega das Chaves</Label>
                      <p className="text-xs text-muted-foreground">Valor pago quando receber as chaves (opcional)</p>
                  </div>
                </div>
                
                {/* Switch de Cálculo Automático de Saldo */}
                <div className="flex items-center gap-2 pb-3 border-b border-border">
          <Switch 
            checked={data.keysPayment?.isSaldoMode || false}
            onCheckedChange={(checked) => {
              if (checked) {
                // Verificar se outro campo já está usando auto-cálculo
                const otherField = checkOtherAutoCalculate('keys');
                if (otherField) {
                  toast({
                    title: "Cálculo automático já ativo",
                    description: `O campo "${otherField}" já está usando cálculo automático. Desative-o primeiro para usar em outro campo.`,
                    variant: "destructive",
                    duration: 4000,
                  });
                  return;
                }
                
                // Ativar modo saldo automático
                const result = calculate();
                const remaining = data.propertyValue - result.totalPaid + (result.keysPayment?.value || 0);
                
                updateField('keysPayment', {
                  type: 'value',
                  value: remaining,
                  percentage: data.propertyValue > 0 ? (remaining / data.propertyValue) * 100 : 0,
                  isSaldoMode: true
                });
              } else {
                // Desativar modo automático
                updateField('keysPayment', {
                  ...data.keysPayment,
                  isSaldoMode: false
                });
              }
            }}
          />
          <Label className="text-sm font-medium cursor-pointer">
            Calcular automaticamente (saldo restante)
          </Label>
        </div>
                
                {/* Linha única no desktop */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                  {/* Botões %/R$: 2 colunas */}
                  <div className="md:col-span-2 grid grid-cols-2 gap-2">
                    <Button 
                      type="button"
                      size="sm"
                      variant={data.keysPayment?.type === 'percentage' ? 'default' : 'outline'}
                      onClick={() => handleKeysTypeChange('percentage')}
                      disabled={data.keysPayment?.isSaldoMode}
                      className="h-9 text-xs"
                    >
                      %
                    </Button>
                    <Button 
                      type="button"
                      size="sm"
                      variant={data.keysPayment?.type === 'value' ? 'default' : 'outline'}
                      onClick={() => handleKeysTypeChange('value')}
                      disabled={data.keysPayment?.isSaldoMode}
                      className="h-9 text-xs"
                    >
                      R$
                    </Button>
                  </div>

                  {/* Campo Valor: 7 colunas (aumentado de 6 para 7) */}
                  <div className="md:col-span-7">
                    <Label className="text-xs mb-1">
                      Valor das Chaves
                      {data.keysPayment?.isSaldoMode && (
                        <span className="text-blue-600 dark:text-blue-400 ml-1 font-semibold">(automático)</span>
                      )}
                    </Label>
                    {data.keysPayment?.type === 'percentage' ? (
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="10"
                        value={data.keysPayment.percentage || ""}
                        onChange={(e) => handleKeysPercentageChange(e.target.value)}
                        disabled={data.keysPayment?.isSaldoMode}
                        className="h-9"
                      />
                    ) : (
                      <Input
                        type="text"
                        placeholder="R$ 160.000,00"
                        value={data.keysPayment?.value ? `R$ ${formatCurrencyInput(data.keysPayment.value)}` : ""}
                        onChange={(e) => formatKeysPayment(e.target.value)}
                        disabled={data.keysPayment?.isSaldoMode}
                        className={`h-9 ${data.keysPayment?.isSaldoMode ? 'text-blue-600 dark:text-blue-400 font-semibold border-blue-300 dark:border-blue-700' : ''}`}
                      />
                    )}
                  </div>

                  {/* Data de Entrega: 3 colunas */}
                  <div className="md:col-span-3">
                    <Label className="text-xs mb-1">Entrega das Chaves</Label>
                    <Input
                      type="date"
                      value={data.deliveryDate || ""}
                      onChange={(e) => updateField("deliveryDate", e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Column (Desktop) - Sticky Container */}
            <div className="hidden lg:block">
              <div className="sticky top-20 space-y-4">
                <FlowSummary result={result} propertyValue={data.propertyValue} currency={data.currency} />
                <div className="space-y-3">
                  {result.exceedsLimit && (
                    <p className="text-xs text-destructive text-center font-medium">
                      ⚠️ Ajuste os valores antes de salvar ou baixar
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <Button 
                      onClick={handleDownloadPDF} 
                      className="w-full" 
                      size="lg" 
                      variant="outline"
                      disabled={result.exceedsLimit}
                    >
                      <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-sm sm:text-base">Baixar PDF</span>
                    </Button>
                    <Button 
                      onClick={handleDownloadTXT} 
                      className="w-full" 
                      size="lg" 
                      variant="outline"
                      disabled={result.exceedsLimit}
                    >
                      <FileText className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-sm sm:text-base">Baixar TXT</span>
                    </Button>
                  </div>
                  <Button
                    onClick={handleSaveProposal}
                    className="w-full"
                    size="lg"
                    disabled={isSaving || result.exceedsLimit}
                  >
                    <Save className="mr-2 h-5 w-5" />
                    {isSaving ? "Salvando..." : "Salvar Proposta"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Summary (Mobile) */}
            <div className="lg:hidden space-y-4">
              <FlowSummary result={result} propertyValue={data.propertyValue} currency={data.currency} />
              <div className="space-y-3">
                {result.exceedsLimit && (
                  <p className="text-xs text-destructive text-center font-medium">
                    ⚠️ Ajuste os valores antes de salvar ou baixar
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <Button 
                    onClick={handleDownloadPDF} 
                    className="w-full" 
                    size="lg" 
                    variant="outline"
                    disabled={result.exceedsLimit}
                  >
                    <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">Baixar PDF</span>
                  </Button>
                  <Button 
                    onClick={handleDownloadTXT} 
                    className="w-full" 
                    size="lg" 
                    variant="outline"
                    disabled={result.exceedsLimit}
                  >
                    <FileText className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">Baixar TXT</span>
                  </Button>
                </div>
                <Button
                  onClick={handleSaveProposal}
                  className="w-full"
                  size="lg"
                  disabled={isSaving || result.exceedsLimit}
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
