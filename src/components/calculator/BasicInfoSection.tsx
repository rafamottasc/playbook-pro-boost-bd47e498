import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentFlowData } from "@/hooks/usePaymentFlow";
import { differenceInMonths, parseISO } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { parseCurrencyInput, formatCurrencyInput } from "@/lib/utils";

interface BasicInfoSectionProps {
  data: PaymentFlowData;
  onChange: (field: string, value: any) => void;
}

export function BasicInfoSection({ data, onChange }: BasicInfoSectionProps) {
  const formatCurrency = (value: string) => {
    const amount = parseCurrencyInput(value);
    onChange("propertyValue", amount);
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
        <CardTitle className="text-xl">📋 Informações Básicas</CardTitle>
        <CardDescription>
          Dados essenciais para o cálculo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Linha 1: 3 campos principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="mb-2 text-sm">Valor Total do Imóvel</Label>
            <Input
              type="text"
              placeholder="R$ 1.600.000,00"
              value={data.propertyValue ? `R$ ${formatCurrencyInput(data.propertyValue)}` : ""}
              onChange={(e) => formatCurrency(e.target.value)}
              className="h-10 font-semibold"
            />
          </div>

          <div>
            <Label className="mb-2 text-sm">🔑 Entrega das Chaves</Label>
            <Input
              type="date"
              value={data.deliveryDate}
              onChange={(e) => onChange("deliveryDate", e.target.value)}
              className="h-10"
            />
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

        <div className="pt-3 border-t">
          <Collapsible defaultOpen={false}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className="h-4 w-4" />
              📋 Campos opcionais (para o PDF)
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              {/* Linha 1: Construtora e Empreendimento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Construtora</Label>
                  <Input
                    type="text"
                    placeholder="Nome da construtora"
                    value={data.constructora || ""}
                    onChange={(e) => onChange("constructora", e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Empreendimento</Label>
                  <Input
                    type="text"
                    placeholder="Nome do empreendimento"
                    value={data.empreendimento || ""}
                    onChange={(e) => onChange("empreendimento", e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Linha 2: Unidade e Área Privativa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Unidade</Label>
                  <Input
                    type="text"
                    placeholder="Ex: 301"
                    value={data.unidade || ""}
                    onChange={(e) => onChange("unidade", e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Área Privativa</Label>
                  <Input
                    type="text"
                    placeholder="Ex: 85m²"
                    value={data.areaPrivativa || ""}
                    onChange={(e) => onChange("areaPrivativa", e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
