import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaymentFlowData } from "@/hooks/usePaymentFlow";

interface DownPaymentSectionProps {
  data: PaymentFlowData;
  onChange: (field: string, value: any) => void;
}

export function DownPaymentSection({ data, onChange }: DownPaymentSectionProps) {
  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = parseInt(numbers || "0");
    onChange("downPayment", amount);
  };

  return (
    <Card className="bg-green-50/30 border-green-200 animate-fade-in">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          🏁 ENTRADA (quando assinar o contrato)
        </CardTitle>
        <CardDescription>
          Quanto o cliente vai dar de entrada?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          type="text"
          placeholder="R$ 136.952,49"
          value={data.downPayment ? `R$ ${data.downPayment.toLocaleString("pt-BR")}` : ""}
          onChange={(e) => formatCurrency(e.target.value)}
          className="text-2xl h-16 font-semibold text-center"
        />
      </CardContent>
    </Card>
  );
}
