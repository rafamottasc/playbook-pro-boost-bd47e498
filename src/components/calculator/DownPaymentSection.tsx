import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PaymentFlowData } from "@/hooks/usePaymentFlow";
import { formatMoney, parseCurrencyInput, formatCurrencyInput } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface DownPaymentSectionProps {
  data: PaymentFlowData;
  onChange: (field: string, value: any) => void;
}

export function DownPaymentSection({ data, onChange }: DownPaymentSectionProps) {
  const handleTypeChange = (type: 'percentage' | 'value') => {
    onChange("downPayment", { ...data.downPayment, type });
  };

  const handlePercentageChange = (value: string) => {
    const percentage = parseFloat(value) || 0;
    const calculatedValue = (percentage / 100) * data.propertyValue;
    onChange("downPayment", { 
      ...data.downPayment, 
      percentage, 
      value: calculatedValue 
    });
  };

  const handleValueChange = (value: string) => {
    const amount = parseCurrencyInput(value);
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
        <CardTitle className="text-xl flex items-center gap-2">
          🏁 ENTRADA (quando assinar o contrato)
        </CardTitle>
        <CardDescription>
          Quanto o cliente vai dar de entrada?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button 
            type="button"
            variant={data.downPayment.type === 'percentage' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('percentage')}
            className="flex-1"
          >
            % Percentual
          </Button>
          <Button 
            type="button"
            variant={data.downPayment.type === 'value' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('value')}
            className="flex-1"
          >
            R$ Valor
          </Button>
        </div>

        {data.downPayment.type === 'percentage' ? (
          <div>
            <Input
              type="number"
              step="0.1"
              placeholder="10"
              value={data.downPayment.percentage || ""}
              onChange={(e) => handlePercentageChange(e.target.value)}
              className="text-lg h-11 font-semibold text-center"
            />
            {data.propertyValue > 0 && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                = R$ {formatMoney(displayValue)}
              </p>
            )}
          </div>
        ) : (
          <div>
            <Input
              type="text"
              placeholder="R$ 160.000,00"
              value={data.downPayment.value ? `R$ ${formatCurrencyInput(data.downPayment.value)}` : ""}
              onChange={(e) => handleValueChange(e.target.value)}
              className="text-lg h-11 font-semibold text-center"
            />
            {data.propertyValue > 0 && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                = {displayPercentage.toFixed(1)}%
              </p>
            )}
          </div>
        )}

        <div className="pt-3 border-t space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="mb-2">Parcelar entrada em quantas vezes?</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="1 (à vista)"
                value={data.downPayment.installments || ''}
                onChange={(e) => handleInstallmentsChange(e.target.value)}
                className="h-10"
              />
              {installmentValue > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {data.downPayment.installments}x de R$ {formatMoney(installmentValue)}
                </p>
              )}
            </div>

            <div>
              <Label className="mb-2 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                1º Vencimento (opcional)
              </Label>
              <Input
                type="date"
                value={data.downPayment.firstDueDate || ""}
                onChange={(e) => handleDateChange(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
