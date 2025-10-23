import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PaymentFlowData } from "@/hooks/usePaymentFlow";
import { parseCurrencyInput, formatCurrencyInput } from "@/lib/utils";
import { Calendar, CalendarDays, CalendarRange, TrendingUp } from "lucide-react";

interface PaymentBlockProps {
  type: "monthly" | "semiannual" | "annual";
  data: PaymentFlowData;
  onChange: (field: string, value: any) => void;
  calculatedValue?: number;
}

const CONFIG = {
  monthly: {
    icon: CalendarDays,
    title: "Parcelas Mensais",
    subtitle: "Cliente quer pagar mensalmente?",
    color: "blue",
    placeholder: "Ex: 100",
  },
  semiannual: {
    icon: CalendarRange,
    title: "Reforços Semestrais",
    subtitle: "Cliente quer reforços a cada 6 meses?",
    color: "purple",
    placeholder: "Ex: 10",
  },
  annual: {
    icon: TrendingUp,
    title: "Reforços Anuais",
    subtitle: "Cliente quer reforços anuais?",
    color: "orange",
    placeholder: "Ex: 10",
  },
};

export function PaymentBlock({ type, data, onChange, calculatedValue }: PaymentBlockProps) {
  const config = CONFIG[type];
  
  const fieldName = type === 'monthly' ? 'monthly' : 
                    type === 'semiannual' ? 'semiannualReinforcement' : 
                    'annualReinforcement';
  
  const paymentData = data[fieldName as keyof PaymentFlowData] as any;

  const handleToggle = (checked: boolean) => {
    onChange(fieldName, { ...paymentData, enabled: checked });
  };

  const handleAutoCalculateToggle = (checked: boolean) => {
    if (checked) {
      // Verificar se outro campo já está usando auto-cálculo
      const hasOtherAutoCalc = (window as any).checkOtherAutoCalculate?.(type);
      if (hasOtherAutoCalc) {
        return; // Bloqueia a ativação
      }
    }
    
    onChange(fieldName, {
      ...paymentData,
      autoCalculate: checked,
      ...(checked ? { value: undefined, percentage: undefined } : {})
    });
  };

  const handlePercentageChange = (value: string) => {
    const percentage = parseFloat(value) || 0;
    const calculatedValue = (percentage / 100) * data.propertyValue;
    onChange(fieldName, { 
      ...paymentData, 
      percentage,
      value: calculatedValue,
      autoCalculate: false
    });
  };

  const handleValueChange = (value: string) => {
    const amount = parseCurrencyInput(value);
    const calculatedPercentage = data.propertyValue > 0 
      ? (amount / data.propertyValue) * 100 
      : 0;
    onChange(fieldName, { 
      ...paymentData, 
      value: amount,
      percentage: calculatedPercentage,
      autoCalculate: false
    });
  };

  const handleDateChange = (date: string) => {
    onChange(fieldName, {
      ...paymentData,
      firstDueDate: date
    });
  };

  const handleTypeChange = (newType: 'percentage' | 'value') => {
    if (newType === 'percentage' && paymentData?.value) {
      // Converter R$ → %
      const percentage = data.propertyValue > 0 
        ? (paymentData.value / data.propertyValue) * 100 
        : 0;
      onChange(fieldName, { 
        ...paymentData, 
        type: 'percentage',
        percentage,
        value: paymentData.value
      });
    } else if (newType === 'value' && paymentData?.percentage) {
      // Converter % → R$
      const value = (paymentData.percentage / 100) * data.propertyValue;
      onChange(fieldName, { 
        ...paymentData, 
        type: 'value',
        value,
        percentage: paymentData.percentage
      });
    } else {
      onChange(fieldName, { 
        ...paymentData, 
        type: newType 
      });
    }
  };

  return (
    <Card className={`animate-fade-in border-l-4 border-l-primary ${paymentData?.autoCalculate ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
      <CardHeader className={paymentData?.autoCalculate ? 'bg-blue-50 dark:bg-blue-950/40' : ''}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <config.icon className="h-5 w-5 text-primary" />
              {config.title}
              {paymentData?.autoCalculate && (
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-normal">
                  AUTO
                </span>
              )}
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
          {/* Switch de Cálculo Automático - para todos os tipos */}
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Switch 
              checked={paymentData?.autoCalculate || false}
              onCheckedChange={handleAutoCalculateToggle}
            />
            <Label className="text-sm font-medium cursor-pointer">
              Calcular automaticamente (saldo restante)
            </Label>
          </div>
          
          {/* Layout compacto em uma linha para desktop */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
            {/* Botões %/R$: 2 colunas */}
            <div className="md:col-span-2 grid grid-cols-2 gap-2">
              <Button 
                type="button"
                size="sm"
                variant={paymentData?.type === 'percentage' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('percentage')}
                disabled={paymentData?.autoCalculate}
                className="h-9 text-xs"
              >
                %
              </Button>
              <Button 
                type="button"
                size="sm"
                variant={paymentData?.type === 'value' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('value')}
                disabled={paymentData?.autoCalculate}
                className="h-9 text-xs"
              >
                R$
              </Button>
            </div>

            {/* Meses/Vezes: 2 colunas */}
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

            {/* Campo Valor: 5 colunas */}
            <div className="md:col-span-5">
              <Label className="text-xs mb-1">
                {type === 'monthly' ? 'Valor/Mês' : 'Valor do Reforço'}
                {paymentData?.autoCalculate && (
                  <span className="text-blue-600 ml-1 font-semibold">(automático)</span>
                )}
              </Label>
              {paymentData?.type === 'percentage' ? (
                <Input
                  type="number"
                  step="0.1"
                  placeholder="10"
                  value={paymentData.percentage || ""}
                  onChange={(e) => handlePercentageChange(e.target.value)}
                  disabled={paymentData?.autoCalculate}
                  className="h-9"
                />
              ) : (
                <Input
                  type="text"
                  placeholder={type === 'monthly' ? "R$ 11.840" : "R$ 80.000"}
                  value={
                    paymentData?.autoCalculate && calculatedValue
                      ? `R$ ${formatCurrencyInput(calculatedValue)}`
                      : paymentData.value 
                        ? `R$ ${formatCurrencyInput(paymentData.value)}` 
                        : ""
                  }
                  onChange={(e) => handleValueChange(e.target.value)}
                  disabled={paymentData?.autoCalculate}
                  className={`h-9 ${paymentData?.autoCalculate ? 'text-blue-600 dark:text-blue-400 font-semibold border-blue-300 dark:border-blue-700' : ''}`}
                />
              )}
            </div>

            {/* Data: 3 colunas */}
            <div className="md:col-span-3">
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
          </div>
        </CardContent>
      )}
    </Card>
  );
}
