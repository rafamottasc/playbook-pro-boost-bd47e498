import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PaymentFlowData } from "@/hooks/usePaymentFlow";

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

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          1️⃣ INFORMAÇÕES BÁSICAS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-base">💰 Valor Total do Imóvel</Label>
          <Input
            type="text"
            placeholder="R$ 1.369.524,91"
            value={data.propertyValue ? `R$ ${data.propertyValue.toLocaleString("pt-BR")}` : ""}
            onChange={(e) => formatCurrency(e.target.value)}
            className="text-lg h-14"
          />
        </div>
        
        <div>
          <Label className="text-base">📅 Entrega das Chaves</Label>
          <Input
            type="date"
            value={data.deliveryDate}
            onChange={(e) => onChange("deliveryDate", e.target.value)}
            className="text-lg h-14"
          />
        </div>
        
        <div>
          <Label className="text-base">👤 Nome do Cliente</Label>
          <Input
            type="text"
            placeholder="João Silva"
            value={data.clientName}
            onChange={(e) => onChange("clientName", e.target.value)}
            className="text-lg h-14"
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
