import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PaymentFlowData } from "@/hooks/usePaymentFlow";
import { parseCurrencyInput, formatCurrencyInput } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface PaymentBlockProps {
  type: "monthly" | "semiannual" | "annual";
  data: PaymentFlowData;
  onChange: (field: string, value: any) => void;
}

const CONFIG = {
  monthly: {
    emoji: "📅",
    title: "PARCELAS MENSAIS",
    subtitle: "Cliente quer pagar mensalmente?",
    color: "blue",
    placeholder: "Ex: 100",
  },
  semiannual: {
    emoji: "📆",
    title: "REFORÇOS SEMESTRAIS",
    subtitle: "Cliente quer reforços a cada 6 meses?",
    color: "purple",
    placeholder: "Ex: 10",
  },
  annual: {
    emoji: "📊",
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

  return (
    <Card className="animate-fade-in border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              {config.emoji} {config.title}
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
          {(type === 'monthly' || type === 'semiannual' || type === 'annual') && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <Switch 
                checked={paymentData?.autoCalculate || false} 
                onCheckedChange={handleAutoCalculateToggle}
              />
              <Label>
                {type === 'monthly' ? 'Calcular valor automaticamente' : 'Calcular por percentual'}
              </Label>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="mb-2">Quantas vezes?</Label>
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
                className="h-10"
              />
            </div>

            <div>
              <Label className="mb-2 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                1º Vencimento (opcional)
              </Label>
              <Input
                type="date"
                value={paymentData.firstDueDate || ""}
                onChange={(e) => handleDateChange(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          {type === 'monthly' && paymentData?.autoCalculate ? (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-1">Valor calculado automaticamente</p>
              <p className="text-xl font-bold text-blue-700">
                R$ {autoCalculatedValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Baseado no saldo restante ÷ {paymentData.count} parcelas
              </p>
            </div>
          ) : type !== 'monthly' && paymentData?.autoCalculate ? (
            <div>
              <Label className="mb-2">Percentual de cada reforço (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="8"
                value={paymentData.percentage || ""}
                onChange={(e) => handlePercentageChange(e.target.value)}
                className="h-10"
              />
              {data.propertyValue > 0 && paymentData.percentage && paymentData.count && (
                <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-muted-foreground">
                    {paymentData.count}x de {paymentData.percentage}% = <span className="font-bold text-purple-700">{(paymentData.count * paymentData.percentage).toFixed(1)}% do total</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    = R$ {((paymentData.percentage / 100) * data.propertyValue).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} cada
                  </p>
                </div>
              )}
            </div>
          ) : type !== 'monthly' ? (
            <div>
              <Label className="mb-2">Valor de cada reforço</Label>
              <Input
                type="text"
                placeholder="R$ 80.000,00"
                value={
                  paymentData.value
                    ? `R$ ${formatCurrencyInput(paymentData.value)}`
                    : ""
                }
                onChange={(e) => formatCurrency(e.target.value)}
                className="text-base h-11 font-semibold"
              />
              {data.propertyValue > 0 && paymentData.value && (
                <p className="text-sm text-muted-foreground mt-1">
                  = {((paymentData.value / data.propertyValue) * 100).toFixed(1)}% do total
                </p>
              )}
            </div>
          ) : (
            <div>
              <Label className="mb-2">Valor de cada parcela</Label>
              <Input
                type="text"
                placeholder="R$ 11.840,00"
                value={
                  paymentData.value
                    ? `R$ ${formatCurrencyInput(paymentData.value)}`
                    : ""
                }
                onChange={(e) => formatCurrency(e.target.value)}
                className="text-base h-11 font-semibold"
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
