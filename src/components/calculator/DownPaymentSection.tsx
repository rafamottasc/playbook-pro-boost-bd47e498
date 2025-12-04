import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PaymentFlowData } from "@/hooks/usePaymentFlow";
import { formatMoney, parseCurrencyInput, formatCurrencyInput } from "@/lib/utils";
import { Calendar, Receipt } from "lucide-react";

interface DownPaymentSectionProps {
  data: PaymentFlowData;
  onChange: (field: string, value: any) => void;
}

export function DownPaymentSection({ data, onChange }: DownPaymentSectionProps) {
  const handleTypeChange = (type: 'percentage' | 'value') => {
    onChange("downPayment", { ...data.downPayment, type });
  };

  const handlePercentageChange = (value: string) => {
    // Se campo vazio, definir como 0
    const percentage = value === '' ? 0 : (parseFloat(value) || 0);
    
    // Auto-switch: se valor > 100, converter para R$ (ninguém dá mais de 100% de entrada)
    if (percentage > 100) {
      const amount = percentage; // O número digitado é o valor em R$
      const calculatedPercentage = data.propertyValue > 0 ? (amount / data.propertyValue) * 100 : 0;
      onChange("downPayment", { 
        ...data.downPayment, 
        type: 'value',
        value: amount,
        percentage: calculatedPercentage
      });
      return;
    }
    
    const calculatedValue = (percentage / 100) * data.propertyValue;
    onChange("downPayment", { 
      ...data.downPayment, 
      percentage, 
      value: calculatedValue 
    });
  };

  const handleValueChange = (value: string) => {
    // Se campo vazio, definir como 0
    const amount = value === '' ? 0 : parseCurrencyInput(value);
    const calculatedPercentage = data.propertyValue > 0 ? (amount / data.propertyValue) * 100 : 0;
    onChange("downPayment", { 
      ...data.downPayment, 
      value: amount,
      percentage: calculatedPercentage
    });
  };

  const handleInstallmentsChange = (value: string) => {
    // Remove tudo que não é número
    const sanitized = value.replace(/\D/g, '');
    const installments = sanitized === '' ? 1 : parseInt(sanitized);
    onChange("downPayment", { 
      ...data.downPayment, 
      installments 
    });
  };

  const displayValue = data.downPayment.type === 'percentage' && data.downPayment.percentage
    ? (data.downPayment.percentage / 100) * data.propertyValue
    : data.downPayment.value || 0;

  const displayPercentage = data.downPayment.type === 'value' && data.downPayment.value && data.propertyValue > 0
    ? (data.downPayment.value / data.propertyValue) * 100
    : data.downPayment.percentage || 0;

  const installmentValue = data.downPayment.installments && data.downPayment.installments > 1
    ? displayValue / data.downPayment.installments
    : 0;

  const handleDateChange = (date: string) => {
    onChange("downPayment", {
      ...data.downPayment,
      firstDueDate: date
    });
  };

  return (
    <Card className="animate-fade-in border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Entrada Parcelada
        </CardTitle>
        <CardDescription>
          Quanto o cliente vai dar de entrada?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Linha única compacta para desktop */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
          {/* Botões: 3 colunas */}
          <div className="md:col-span-3 grid grid-cols-2 gap-2">
            <Button 
              type="button"
              size="sm"
              variant={data.downPayment.type === 'percentage' ? 'default' : 'outline'}
              onClick={() => handleTypeChange('percentage')}
              className="h-9"
            >
              %
            </Button>
            <Button 
              type="button"
              size="sm"
              variant={data.downPayment.type === 'value' ? 'default' : 'outline'}
              onClick={() => handleTypeChange('value')}
              className="h-9"
            >
              R$
            </Button>
          </div>

    {/* Campo Valor: 4 colunas */}
    <div className="md:col-span-4">
      <Label className="text-xs mb-1">Valor da Entrada</Label>
      {data.downPayment.type === 'percentage' ? (
        <Input
          type="number"
          step="0.1"
          placeholder="10"
          value={data.downPayment.percentage || ""}
          onChange={(e) => handlePercentageChange(e.target.value)}
          className="h-9"
        />
      ) : (
        <Input
          type="text"
          placeholder="R$ 160.000,00"
          value={data.downPayment.value ? `R$ ${formatCurrencyInput(data.downPayment.value)}` : ""}
          onChange={(e) => handleValueChange(e.target.value)}
          className="h-9"
        />
      )}
    </div>

          {/* Parcelas: 2 colunas */}
          <div className="md:col-span-2">
            <Label className="text-xs mb-1">Parcelas</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="1"
              value={data.downPayment.installments || ''}
              onChange={(e) => handleInstallmentsChange(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Data: 3 colunas */}
          <div className="md:col-span-3">
            <Label className="text-xs mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              1º Venc.
            </Label>
            <Input
              type="date"
              value={data.downPayment.firstDueDate || ""}
              onChange={(e) => handleDateChange(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        {/* Mostrar valor da parcela */}
        {installmentValue > 0 && (
          <p className="text-xs text-muted-foreground">
            {data.downPayment.installments}x de R$ {formatMoney(installmentValue)}
          </p>
        )}
        
        {/* Aviso quando entrada for zerada */}
        {displayValue === 0 && (
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded">
            ℹ️ Entrada zerada - todo o valor será pago nas demais etapas
          </div>
        )}
      </CardContent>
    </Card>
  );
}
