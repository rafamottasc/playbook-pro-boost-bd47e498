import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentFlowData, Currency } from "@/hooks/usePaymentFlow";
import { differenceInMonths, parseISO } from "date-fns";
import { ClipboardList, Building2, DollarSign } from "lucide-react";
import { parseCurrencyInput, formatCurrencyInput } from "@/lib/utils";

interface BasicInfoSectionProps {
  data: PaymentFlowData;
  onChange: (field: string, value: any) => void;
}

export function BasicInfoSection({ data, onChange }: BasicInfoSectionProps) {
  const currencies: Currency[] = [
    { code: 'BRL', symbol: 'R$', rate: 1, name: 'Real Brasileiro (BRL)' },
    { code: 'USD', symbol: '$', rate: 5.0, name: 'Dólar Americano (USD)' },
    { code: 'EUR', symbol: '€', rate: 5.5, name: 'Euro (EUR)' },
    { code: 'GBP', symbol: '£', rate: 6.5, name: 'Libra Esterlina (GBP)' },
  ];

  const currentCurrency = data.currency || currencies[0];

  const formatCurrency = (value: string) => {
    const amount = parseCurrencyInput(value);
    onChange("propertyValue", amount);
  };

  const handleCurrencyChange = (code: string) => {
    const selectedCurrency = currencies.find(c => c.code === code);
    if (selectedCurrency) {
      onChange("currency", selectedCurrency);
    }
  };

  const handleExchangeRateChange = (value: string) => {
    const rate = parseFloat(value.replace(',', '.'));
    if (!isNaN(rate) && rate > 0) {
      onChange("currency", { ...currentCurrency, rate });
    }
  };

  const calculateMonthsUntilDelivery = () => {
    // Buscar primeiro pagamento
    const dates: Date[] = [];
    
    if (data.downPayment.ato?.firstDueDate) {
      try { dates.push(parseISO(data.downPayment.ato.firstDueDate)); } catch {}
    }
    if (data.downPayment.firstDueDate) {
      try { dates.push(parseISO(data.downPayment.firstDueDate)); } catch {}
    }
    if (data.constructionStartPayment?.firstDueDate) {
      try { dates.push(parseISO(data.constructionStartPayment.firstDueDate)); } catch {}
    }
    if (data.monthly?.firstDueDate) {
      try { dates.push(parseISO(data.monthly.firstDueDate)); } catch {}
    }
    
    if (dates.length > 0 && data.deliveryDate) {
      try {
        const firstDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const end = parseISO(data.deliveryDate);
        return Math.max(0, differenceInMonths(end, firstDate));
      } catch (e) {
        return 0;
      }
    }
    return 0;
  };

  const monthsUntilDelivery = calculateMonthsUntilDelivery();

  return (
    <Card className="animate-fade-in border-l-4 border-l-primary">
      <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        Informações Básicas
      </CardTitle>
        <CardDescription>
          Dados essenciais para o cálculo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Linha 1: Moeda e Cotação */}
        <div className="p-3 bg-muted/30 rounded-lg border space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <Label className="text-sm font-semibold">Configuração de Moeda</Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="mb-2 text-xs text-muted-foreground">Moeda</Label>
              <Select value={currentCurrency.code} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(curr => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentCurrency.code !== 'BRL' && (
              <div>
                <Label className="mb-2 text-xs text-muted-foreground">
                  Cotação (1 {currentCurrency.code} = X BRL)
                </Label>
                <Input
                  type="text"
                  placeholder="Ex: 5.50"
                  value={currentCurrency.rate.toString().replace('.', ',')}
                  onChange={(e) => handleExchangeRateChange(e.target.value)}
                  className="h-9"
                />
              </div>
            )}
          </div>

          {currentCurrency.code !== 'BRL' && (
            <p className="text-xs text-muted-foreground">
              💡 Valores serão calculados em BRL e convertidos para {currentCurrency.code} usando a cotação acima
            </p>
          )}
        </div>

        {/* Linha 2: Valor e Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="mb-2 text-sm">Valor Total do Imóvel (em BRL)</Label>
            <Input
              type="text"
              placeholder="R$ 1.600.000,00"
              value={data.propertyValue ? `R$ ${formatCurrencyInput(data.propertyValue)}` : ""}
              onChange={(e) => formatCurrency(e.target.value)}
              className="h-10 font-semibold"
            />
            {currentCurrency.code !== 'BRL' && data.propertyValue > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {currentCurrency.symbol} {formatCurrencyInput(data.propertyValue / currentCurrency.rate)}
              </p>
            )}
          </div>

          <div>
            <Label className="mb-2 text-sm">Nome do Cliente</Label>
            <Input
              type="text"
              placeholder="Ex: João Silva"
              value={data.clientName}
              onChange={(e) => onChange("clientName", e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        {monthsUntilDelivery > 0 && (
          <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 font-medium">
              ⏱️ {monthsUntilDelivery} meses até a entrega ({(monthsUntilDelivery / 12).toFixed(1)} anos)
            </p>
          </div>
        )}

        {/* Seção Opcional - Dados do Empreendimento */}
        <div className="pt-3 border-t space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm text-muted-foreground">
              Dados do Empreendimento (opcional)
            </Label>
          </div>
          
          {/* 4 campos em 1 linha no desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs mb-1">Construtora</Label>
              <Input
                placeholder="Nome da construtora"
                value={data.constructora || ""}
                onChange={(e) => onChange("constructora", e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs mb-1">Empreendimento</Label>
              <Input
                placeholder="Nome do empreendimento"
                value={data.empreendimento || ""}
                onChange={(e) => onChange("empreendimento", e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs mb-1">Unidade</Label>
              <Input
                placeholder="Ex: Apto 101"
                value={data.unidade || ""}
                onChange={(e) => onChange("unidade", e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs mb-1">Área Privativa</Label>
              <Input
                placeholder="Ex: 75m²"
                value={data.areaPrivativa || ""}
                onChange={(e) => onChange("areaPrivativa", e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          
          {/* Campo Descritivo do Imóvel */}
          <div className="mt-3">
            <Label className="text-sm mb-2">Descritivo do Imóvel</Label>
            <Textarea
              placeholder="Ex: Apartamento com 3 quartos sendo 1 suíte, sala de estar e jantar integradas, varanda gourmet..."
              value={data.descritivoImovel || ""}
              onChange={(e) => onChange("descritivoImovel", e.target.value)}
              className="min-h-[40px] resize-none"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
