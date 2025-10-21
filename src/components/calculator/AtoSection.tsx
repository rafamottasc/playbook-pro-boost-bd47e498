import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PaymentFlowData } from "@/hooks/usePaymentFlow";
import { parseCurrencyInput, formatCurrencyInput } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface AtoSectionProps {
  data: PaymentFlowData;
  onChange: (field: string, value: any) => void;
}

export function AtoSection({ data, onChange }: AtoSectionProps) {
  const handleTypeChange = (type: 'percentage' | 'value') => {
    onChange("downPayment", { 
      ...data.downPayment, 
      ato: { ...data.downPayment.ato, type } 
    });
  };

  const handlePercentageChange = (value: string) => {
    const percentage = parseFloat(value) || 0;
    const calculatedValue = (percentage / 100) * data.propertyValue;
    onChange("downPayment", { 
      ...data.downPayment, 
      ato: {
        ...data.downPayment.ato,
        type: 'percentage',
        percentage, 
        value: calculatedValue 
      }
    });
  };

  const handleValueChange = (value: string) => {
    const amount = parseCurrencyInput(value);
    const calculatedPercentage = data.propertyValue > 0 ? (amount / data.propertyValue) * 100 : 0;
    onChange("downPayment", { 
      ...data.downPayment, 
      ato: {
        ...data.downPayment.ato,
        type: 'value',
        value: amount,
        percentage: calculatedPercentage
      }
    });
  };

  const handleDateChange = (date: string) => {
    onChange("downPayment", {
      ...data.downPayment,
      ato: {
        ...data.downPayment.ato,
        firstDueDate: date
      }
    });
  };

  const displayValue = data.downPayment.ato?.type === 'percentage' && data.downPayment.ato.percentage
    ? (data.downPayment.ato.percentage / 100) * data.propertyValue
    : data.downPayment.ato?.value || 0;

  const displayPercentage = data.downPayment.ato?.type === 'value' && data.downPayment.ato.value && data.propertyValue > 0
    ? (data.downPayment.ato.value / data.propertyValue) * 100
    : data.downPayment.ato?.percentage || 0;

  return (
    <Card className="animate-fade-in border-l-4 border-l-primary">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xl">💰</span>
          </div>
          <div className="flex-1">
            <Label className="text-base font-semibold">Ato (Pagamento Único)</Label>
            <p className="text-xs text-muted-foreground">Pagamento à vista na assinatura do contrato</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            type="button"
            size="sm"
            variant={data.downPayment.ato?.type === 'percentage' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('percentage')}
          >
            % Percentual
          </Button>
          <Button 
            type="button"
            size="sm"
            variant={data.downPayment.ato?.type === 'value' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('value')}
          >
            R$ Valor
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-sm mb-2">Valor do Ato</Label>
            {data.downPayment.ato?.type === 'percentage' ? (
              <div>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="5"
                  value={data.downPayment.ato.percentage || ""}
                  onChange={(e) => handlePercentageChange(e.target.value)}
                  className="h-10 text-center"
                />
                {data.propertyValue > 0 && displayValue > 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    = R$ {displayValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <Input
                  type="text"
                  placeholder="R$ 80.000,00"
                  value={data.downPayment.ato?.value ? `R$ ${formatCurrencyInput(data.downPayment.ato.value)}` : ""}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="h-10 text-center"
                />
                {data.propertyValue > 0 && displayValue > 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    = {displayPercentage.toFixed(1)}%
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm mb-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              1º Vencimento (opcional)
            </Label>
            <Input
              type="date"
              value={data.downPayment.ato?.firstDueDate || ""}
              onChange={(e) => handleDateChange(e.target.value)}
              className="h-10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
