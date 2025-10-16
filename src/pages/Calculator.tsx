import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Save, History, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentFlow } from "@/hooks/usePaymentFlow";
import { BasicInfoSection } from "@/components/calculator/BasicInfoSection";
import { DownPaymentSection } from "@/components/calculator/DownPaymentSection";
import { PaymentBlock } from "@/components/calculator/PaymentBlock";
import { FlowSummary } from "@/components/calculator/FlowSummary";
import { generateFlowPDF } from "@/components/calculator/FlowPDF";
import { PageTransition } from "@/components/PageTransition";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function Calculator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data, updateField, calculate, setData } = usePaymentFlow();
  const [isSaving, setIsSaving] = useState(false);

  const result = calculate();

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
        .select("full_name")
        .eq("id", user?.id)
        .single();

      await generateFlowPDF(data, result, profile?.full_name || "Corretor");

      toast({
        title: "PDF gerado com sucesso!",
        description: "O arquivo foi baixado",
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

      // Gerar PDF após salvar
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user?.id)
        .single();

      await generateFlowPDF(data, result, profile?.full_name || "Corretor");

      toast({
        title: "Proposta salva com sucesso!",
        description: "PDF gerado e baixado",
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
    const numbers = value.replace(/\D/g, "");
    const amount = parseInt(numbers || "0");
    const calculatedPercentage = data.propertyValue > 0 ? (amount / data.propertyValue) * 100 : 0;
    updateField("keysPayment", {
      ...data.keysPayment,
      value: amount,
      percentage: calculatedPercentage
    });
  };

  const handleKeysTypeChange = (type: 'percentage' | 'value') => {
    updateField("keysPayment", { ...data.keysPayment, type });
  };

  const handleKeysPercentageChange = (value: string) => {
    const percentage = parseFloat(value) || 0;
    const calculatedValue = (percentage / 100) * data.propertyValue;
    updateField("keysPayment", { 
      ...data.keysPayment, 
      percentage, 
      value: calculatedValue 
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
        {/* Header */}
        <div className="bg-card border-b sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Calculadora de Fluxo</h1>
                  <p className="text-sm text-muted-foreground">
                    Simule condições de pagamento
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/calculator/history")}
              >
                <History className="mr-2 h-4 w-4" />
                Histórico
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-2 space-y-6">
              <BasicInfoSection data={data} onChange={updateField} />
              <DownPaymentSection data={data} onChange={updateField} />
              <PaymentBlock type="monthly" data={data} onChange={updateField} />
              <PaymentBlock
                type="semiannual"
                data={data}
                onChange={updateField}
              />
              <PaymentBlock type="annual" data={data} onChange={updateField} />

              {/* Chaves */}
              <Card className="bg-yellow-50/30 border-yellow-200 animate-fade-in">
                <CardContent className="pt-6 space-y-4">
                  <Label className="text-base mb-2 block">
                    🔑 Pagamento na Entrega das Chaves (opcional)
                  </Label>
                  
                  <div className="flex gap-2">
                    <Button 
                      type="button"
                      variant={data.keysPayment?.type === 'percentage' ? 'default' : 'outline'}
                      onClick={() => handleKeysTypeChange('percentage')}
                      className="flex-1"
                    >
                      % Percentual
                    </Button>
                    <Button 
                      type="button"
                      variant={data.keysPayment?.type === 'value' ? 'default' : 'outline'}
                      onClick={() => handleKeysTypeChange('value')}
                      className="flex-1"
                    >
                      R$ Valor
                    </Button>
                  </div>

                  {data.keysPayment?.type === 'percentage' ? (
                    <div>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="8"
                        value={data.keysPayment.percentage || ""}
                        onChange={(e) => handleKeysPercentageChange(e.target.value)}
                        className="text-xl h-14 text-center"
                      />
                      {data.propertyValue > 0 && (
                        <p className="text-sm text-muted-foreground text-center mt-2">
                          = R$ {keysDisplayValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Input
                        type="text"
                        placeholder="R$ 128.000"
                        value={data.keysPayment?.value ? `R$ ${data.keysPayment.value.toLocaleString("pt-BR")}` : ""}
                        onChange={(e) => formatKeysPayment(e.target.value)}
                        className="text-xl h-14 text-center"
                      />
                      {data.propertyValue > 0 && (
                        <p className="text-sm text-muted-foreground text-center mt-2">
                          = {keysDisplayPercentage.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons (Mobile) */}
              <div className="lg:hidden flex gap-3">
                <Button
                  onClick={handleDownloadPDF}
                  className="flex-1"
                  size="lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Baixar PDF
                </Button>
                <Button
                  onClick={handleSaveProposal}
                  variant="secondary"
                  className="flex-1"
                  size="lg"
                  disabled={isSaving}
                >
                  <Save className="mr-2 h-5 w-5" />
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>

            {/* Summary Column (Desktop) */}
            <div className="hidden lg:block">
              <FlowSummary result={result} />
              <div className="mt-6 space-y-3">
                <Button onClick={handleDownloadPDF} className="w-full" size="lg">
                  <Download className="mr-2 h-5 w-5" />
                  Baixar PDF
                </Button>
                <Button
                  onClick={handleSaveProposal}
                  variant="secondary"
                  className="w-full"
                  size="lg"
                  disabled={isSaving}
                >
                  <Save className="mr-2 h-5 w-5" />
                  {isSaving ? "Salvando..." : "Salvar Proposta"}
                </Button>
              </div>
            </div>

            {/* Summary (Mobile) */}
            <div className="lg:hidden">
              <FlowSummary result={result} />
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
