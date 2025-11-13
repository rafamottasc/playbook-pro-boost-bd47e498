import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign } from "lucide-react";
import { PaymentFlowData, Currency } from "@/hooks/usePaymentFlow";

interface CurrencyConfigSectionProps {
  data: PaymentFlowData;
  onChange: (field: keyof PaymentFlowData, value: any) => void;
}

const currencies: Currency[] = [
  { code: 'BRL', symbol: 'R$', rate: 1, name: 'Real Brasileiro' },
  { code: 'USD', symbol: '$', rate: 5.50, name: 'Dólar Americano' },
  { code: 'EUR', symbol: '€', rate: 6.00, name: 'Euro' },
  { code: 'GBP', symbol: '£', rate: 7.00, name: 'Libra Esterlina' },
];

export function CurrencyConfigSection({ data, onChange }: CurrencyConfigSectionProps) {
  const currentCurrency = data.currency || currencies[0];
  
  // Estado local para permitir digitação livre com vírgula
  const [rateInput, setRateInput] = useState(
    currentCurrency.rate.toFixed(2).replace('.', ',')
  );
  const [error, setError] = useState('');

  // Atualizar input quando a moeda mudar
  useEffect(() => {
    setRateInput(currentCurrency.rate.toFixed(2).replace('.', ','));
    setError('');
  }, [currentCurrency.code]);

  const handleCurrencyChange = (code: string) => {
    const selectedCurrency = currencies.find(c => c.code === code);
    if (selectedCurrency) {
      onChange("currency", selectedCurrency);
    }
  };

  const handleRateInputChange = (value: string) => {
    // Permitir apenas números, vírgula e ponto
    const cleaned = value.replace(/[^\d,\.]/g, '');
    setRateInput(cleaned);
    setError('');
  };

  const handleRateBlur = () => {
    // Remover espaços
    const cleaned = rateInput.trim();
    
    // Se estiver vazio, restaurar valor padrão
    if (!cleaned) {
      setRateInput(currentCurrency.rate.toFixed(2).replace('.', ','));
      return;
    }
    
    // Converter vírgula para ponto
    const rate = parseFloat(cleaned.replace(',', '.'));
    
    // Validar
    if (!isNaN(rate) && rate > 0) {
      // Válido: atualizar e formatar
      onChange("currency", { ...currentCurrency, rate });
      setRateInput(rate.toFixed(2).replace('.', ','));
      setError('');
    } else {
      // Inválido: mostrar erro e restaurar
      setError('Digite uma cotação válida (ex: 5,50)');
      setRateInput(currentCurrency.rate.toFixed(2).replace('.', ','));
    }
  };

  return (
    <Card className="animate-fade-in border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          Configuração de Moeda
        </CardTitle>
        <CardDescription className="text-xs">
          Escolha a moeda para cálculo e visualização dos valores
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Seletor de Moeda */}
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-xs font-medium">
              Moeda
            </Label>
            <Select
              value={currentCurrency.code}
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger id="currency" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campo de Cotação (apenas se não for BRL) */}
          {currentCurrency.code !== 'BRL' && (
            <div className="space-y-2">
              <Label htmlFor="exchange-rate" className="text-xs font-medium">
                Cotação ({currentCurrency.code}/BRL)
              </Label>
              <Input
                id="exchange-rate"
                type="text"
                placeholder="Ex: 5,50"
                value={rateInput}
                onChange={(e) => handleRateInputChange(e.target.value)}
                onBlur={handleRateBlur}
                className={`h-9 ${error ? 'border-destructive' : ''}`}
              />
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Nota informativa */}
        {currentCurrency.code !== 'BRL' && (
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded border border-blue-200 dark:border-blue-900">
            💡 Todos os cálculos são feitos em BRL (Real Brasileiro) e convertidos para {currentCurrency.code} usando a cotação de <strong>{currentCurrency.rate.toFixed(2).replace('.', ',')}</strong>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
