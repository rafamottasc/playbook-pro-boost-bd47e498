import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PaymentFlowData } from "@/hooks/usePaymentFlow";
import { parseCurrencyInput, formatCurrencyInput } from "@/lib/utils";
import { Calendar, Calculator, CalendarDays, CalendarRange, TrendingUp } from "lucide-react";

interface PaymentBlockProps {
  type: "monthly" | "semiannual" | "annual";
  data: PaymentFlowData;
  onChange: (field: string, value: any) => void;
}

const CONFIG = {
  monthly: {
    icon: CalendarDays,
    title: "PARCELAS MENSAIS",
    subtitle: "Cliente quer pagar mensalmente?",
    color: "blue",
    placeholder: "Ex: 100",
  },
  semiannual: {
    icon: CalendarRange,
    title: "REFORÇOS SEMESTRAIS",
    subtitle: "Cliente quer reforços a cada 6 meses?",
    color: "purple",
    placeholder: "Ex: 10",
  },
  annual: {
    icon: TrendingUp,
    title: "REFORÇOS ANUAIS",
    subtitle: "Cliente quer reforços anuais?",
    color: "orange",
    placeholder: "Ex: 10",
  },
};

export function PaymentBlock({ type, data, onChange }: PaymentBlockProps) {
  const config = CONFIG[type];
  
  const fieldName = type === 'monthly' ? 'monthly' : 
                    type === 'semiannual' ? 'semiannualReinforcement' : 
                    'annualReinforcement';
  
  const paymentData = data[fieldName as keyof PaymentFlowData] as any;

  const handleToggle = (checked: boolean) => {
    onChange(fieldName, { ...paymentData, enabled: checked });
  };

  const handleAutoCalculateToggle = (checked: boolean) => {
    onChange(fieldName, { ...paymentData, autoCalculate: checked });
  };

  const formatCurrency = (value: string) => {
    const amount = parseCurrencyInput(value);
    onChange(fieldName, { ...paymentData, value: amount });
  };

  const handlePercentageChange = (value: string) => {
    const percentage = parseFloat(value) || 0;
    const calculatedValue = (percentage / 100) * data.propertyValue;
    onChange(fieldName, { 
      ...paymentData, 
      percentage,
      value: calculatedValue
    });
  };

  // Calculate auto value for monthly
  const calculateAutoMonthlyValue = () => {
    if (type !== 'monthly' || !paymentData?.autoCalculate || !paymentData?.count) return 0;
    
    let downPaymentValue = 0;
    if (data.downPayment.type === 'percentage' && data.downPayment.percentage) {
      downPaymentValue = (data.downPayment.percentage / 100) * data.propertyValue;
    } else if (data.downPayment.type === 'value' && data.downPayment.value) {
      downPaymentValue = data.downPayment.value;
    }

    // Calcular valor do Ato
    let atoValue = 0;
    if (data.downPayment.ato) {
      if (data.downPayment.ato.type === 'percentage' && data.downPayment.ato.percentage) {
        atoValue = (data.downPayment.ato.percentage / 100) * data.propertyValue;
      } else if (data.downPayment.ato.type === 'value' && data.downPayment.ato.value) {
        atoValue = data.downPayment.ato.value;
      }
    }

    // Calcular valor de início da obra
    let constructionStartValue = 0;
    if (data.constructionStartPayment) {
      if (data.constructionStartPayment.type === 'percentage' && data.constructionStartPayment.percentage) {
        constructionStartValue = (data.constructionStartPayment.percentage / 100) * data.propertyValue;
      } else if (data.constructionStartPayment.type === 'value' && data.constructionStartPayment.value) {
        constructionStartValue = data.constructionStartPayment.value;
      }
    }

    let totalReinforcements = 0;
    if (data.semiannualReinforcement?.enabled && data.semiannualReinforcement.count) {
      const value = data.semiannualReinforcement.value || 
                    ((data.semiannualReinforcement.percentage || 0) / 100) * data.propertyValue;
      totalReinforcements += value * data.semiannualReinforcement.count;
    }
    if (data.annualReinforcement?.enabled && data.annualReinforcement.count) {
      const value = data.annualReinforcement.value || 
                    ((data.annualReinforcement.percentage || 0) / 100) * data.propertyValue;
      totalReinforcements += value * data.annualReinforcement.count;
    }

    let keysValue = 0;
    if (data.keysPayment) {
      if (data.keysPayment.type === 'percentage' && data.keysPayment.percentage) {
        keysValue = (data.keysPayment.percentage / 100) * data.propertyValue;
      } else if (data.keysPayment.type === 'value' && data.keysPayment.value) {
        keysValue = data.keysPayment.value;
      }
    }

    const remainingBalance = data.propertyValue - atoValue - downPaymentValue - constructionStartValue - totalReinforcements - keysValue;
    return remainingBalance / paymentData.count;
  };

  const autoCalculatedValue = type === 'monthly' ? calculateAutoMonthlyValue() : 0;

  const handleDateChange = (date: string) => {
    onChange(fieldName, {
      ...paymentData,
      firstDueDate: date
    });
  };

  const handleTypeChange = (newType: 'percentage' | 'value') => {
    onChange(fieldName, { 
      ...paymentData, 
      type: newType 
    });
  };

  return (
    <Card className="animate-fade-in border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <config.icon className="h-5 w-5 text-primary" />
              {config.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {config.subtitle}
            </p>
          </div>
          <Switch checked={paymentData?.enabled || false} onCheckedChange={handleToggle} />
        </div>
      </CardHeader>

      {paymentData?.enabled && (
        <CardContent className="space-y-3">
          {/* Layout compacto em uma linha para desktop */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
            {/* Botões %/R$: 2 colunas */}
            <div className="md:col-span-2 grid grid-cols-2 gap-2">
              <Button 
                type="button"
                size="sm"
                variant={paymentData?.type === 'percentage' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('percentage')}
                className="h-9 text-xs"
              >
                %
              </Button>
              <Button 
                type="button"
                size="sm"
                variant={paymentData?.type === 'value' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('value')}
                className="h-9 text-xs"
              >
                R$
              </Button>
            </div>

            {/* Campo Valor: 4 colunas */}
            <div className="md:col-span-4">
              <Label className="text-xs mb-1">
                {type === 'monthly' ? 'Valor/Mês' : 'Valor/Reforço'}
              </Label>
              {type === 'monthly' && paymentData?.autoCalculate ? (
                <div className="h-9 px-3 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700">
                    R$ {autoCalculatedValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ) : paymentData?.type === 'percentage' ? (
                <div className="space-y-0.5">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="10"
                    value={paymentData.percentage || ""}
                    onChange={(e) => handlePercentageChange(e.target.value)}
                    className="h-9"
                  />
                  <div className="h-4 flex items-center">
                    {data.propertyValue > 0 && paymentData.percentage && (
                      <p className="text-xs text-muted-foreground">
                        = R$ {((paymentData.percentage / 100) * data.propertyValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <Input
                    type="text"
                    placeholder={type === 'monthly' ? "R$ 11.840" : "R$ 80.000"}
                    value={paymentData.value ? `R$ ${formatCurrencyInput(paymentData.value)}` : ""}
                    onChange={(e) => formatCurrency(e.target.value)}
                    className="h-9"
                  />
                  <div className="h-4 flex items-center">
                    {data.propertyValue > 0 && paymentData.value && (
                      <p className="text-xs text-muted-foreground">
                        = {((paymentData.value / data.propertyValue) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quantidade: 2 colunas */}
            <div className="md:col-span-2">
              <Label className="text-xs mb-1">
                {type === 'monthly' ? 'Meses' : 'Vezes'}
              </Label>
              <Input
                type="number"
                placeholder={config.placeholder}
                value={paymentData.count || ""}
                onChange={(e) =>
                  onChange(fieldName, {
                    ...paymentData,
                    count: parseInt(e.target.value) || 0,
                  })
                }
                className="h-9"
              />
            </div>

            {/* Data: 2 colunas */}
            <div className="md:col-span-2">
              <Label className="text-xs mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                1º Venc.
              </Label>
              <Input
                type="date"
                value={paymentData.firstDueDate || ""}
                onChange={(e) => handleDateChange(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Botão Auto: 2 colunas */}
            <div className="md:col-span-2">
              <Label className="text-xs mb-1 opacity-0">-</Label>
              <Button 
                type="button"
                size="sm"
                variant={paymentData?.autoCalculate ? 'default' : 'outline'}
                onClick={() => handleAutoCalculateToggle(!paymentData?.autoCalculate)}
                className="h-9 w-full text-xs flex items-center justify-center gap-1"
                title={type === 'monthly' ? 'Calcular automaticamente' : 'Usar percentual'}
              >
                <Calculator className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Info adicional quando necessário */}
          {type === 'monthly' && paymentData?.autoCalculate && paymentData.count > 0 && (
            <p className="text-xs text-blue-600">
              Saldo restante ÷ {paymentData.count} meses
            </p>
          )}
          {type !== 'monthly' && paymentData?.autoCalculate && paymentData.percentage && paymentData.count && data.propertyValue > 0 && (
            <p className="text-xs text-purple-600">
              {paymentData.count}x {paymentData.percentage}% = R$ {((paymentData.percentage / 100) * data.propertyValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} cada
            </p>
          )}
          {!paymentData?.autoCalculate && paymentData.value && data.propertyValue > 0 && (
            <p className="text-xs text-muted-foreground">
              = {((paymentData.value / data.propertyValue) * 100).toFixed(1)}% do total
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
