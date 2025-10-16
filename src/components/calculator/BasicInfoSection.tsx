import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentFlowData } from "@/hooks/usePaymentFlow";
import { differenceInMonths, parseISO } from "date-fns";

interface BasicInfoSectionProps {
  data: PaymentFlowData;
  onChange: (field: string, value: any) => void;
}

export function BasicInfoSection({ data, onChange }: BasicInfoSectionProps) {
  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = parseInt(numbers || "0");
    onChange("propertyValue", amount);
  };

  const calculateMonthsUntilDelivery = () => {
    if (data.constructionStartDate && data.deliveryDate) {
      try {
        const start = parseISO(data.constructionStartDate);
        const end = parseISO(data.deliveryDate);
        return Math.max(0, differenceInMonths(end, start));
      } catch (e) {
        return 0;
      }
    }
    return 0;
  };

  const monthsUntilDelivery = calculateMonthsUntilDelivery();

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-xl">📋 Informações Básicas</CardTitle>
        <CardDescription>
          Dados essenciais para o cálculo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="mb-2">Valor Total do Imóvel</Label>
          <Input
            type="text"
            placeholder="R$ 1.600.000,00"
            value={data.propertyValue ? `R$ ${data.propertyValue.toLocaleString("pt-BR")}` : ""}
            onChange={(e) => formatCurrency(e.target.value)}
            className="text-xl h-14 font-semibold"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2">🏗️ Início da Obra</Label>
            <Input
              type="date"
              value={data.constructionStartDate}
              onChange={(e) => onChange("constructionStartDate", e.target.value)}
              className="h-12"
            />
          </div>

          <div>
            <Label className="mb-2">🔑 Entrega das Chaves</Label>
            <Input
              type="date"
              value={data.deliveryDate}
              onChange={(e) => onChange("deliveryDate", e.target.value)}
              className="h-12"
            />
          </div>
        </div>

        {monthsUntilDelivery > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 font-medium">
              ⏱️ {monthsUntilDelivery} meses até a entrega ({(monthsUntilDelivery / 12).toFixed(1)} anos)
            </p>
          </div>
        )}

        <div>
          <Label className="mb-2">Nome do Cliente</Label>
          <Input
            type="text"
            placeholder="Ex: João Silva"
            value={data.clientName}
            onChange={(e) => onChange("clientName", e.target.value)}
            className="h-12"
          />
        </div>

        <div className="pt-4 border-t space-y-3">
          <p className="text-sm text-muted-foreground">📋 Campos opcionais (para o PDF)</p>
          
          <div>
            <Label className="text-sm">Construtora</Label>
            <Input
              type="text"
              placeholder="Nome da construtora"
              value={data.constructora || ""}
              onChange={(e) => onChange("constructora", e.target.value)}
              className="h-10"
            />
          </div>

          <div>
            <Label className="text-sm">Empreendimento</Label>
            <Input
              type="text"
              placeholder="Nome do empreendimento"
              value={data.empreendimento || ""}
              onChange={(e) => onChange("empreendimento", e.target.value)}
              className="h-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Unidade</Label>
              <Input
                type="text"
                placeholder="Ex: 301"
                value={data.unidade || ""}
                onChange={(e) => onChange("unidade", e.target.value)}
                className="h-10"
              />
            </div>

            <div>
              <Label className="text-sm">Área Privativa</Label>
              <Input
                type="text"
                placeholder="Ex: 85m²"
                value={data.areaPrivativa || ""}
                onChange={(e) => onChange("areaPrivativa", e.target.value)}
                className="h-10"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
