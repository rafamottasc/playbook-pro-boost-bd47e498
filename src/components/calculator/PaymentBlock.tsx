import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { PaymentFlowData } from "@/hooks/usePaymentFlow";

interface PaymentBlockProps {
  type: "monthly" | "semiannual" | "annual";
  data: PaymentFlowData;
  onChange: (field: string, value: any) => void;
}

const CONFIG = {
  monthly: {
    emoji: "📆",
    title: "PARCELAS MENSAIS",
    subtitle: "Cliente vai pagar todo mês?",
    color: "blue",
    placeholder: "Ex: 100 vezes de R$ 2.739,05",
  },
  semiannual: {
    emoji: "🎯",
    title: "PARCELAS SEMESTRAIS",
    subtitle: "Cliente vai pagar a cada 6 meses?",
    color: "purple",
    placeholder: "Ex: 10 vezes de R$ 54.781,00",
  },
  annual: {
    emoji: "🎯",
    title: "PARCELAS ANUAIS",
    subtitle: "Cliente vai pagar a cada ano?",
    color: "orange",
    placeholder: "Ex: 5 vezes de R$ 68.476,00",
  },
};

export function PaymentBlock({ type, data, onChange }: PaymentBlockProps) {
  const config = CONFIG[type];
  const isEnabled = data[type]?.enabled || false;

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = parseInt(numbers || "0");
    return amount;
  };

  return (
    <Card
      className={cn(
        "transition-all duration-300 animate-fade-in",
        isEnabled && config.color === "blue" && "bg-blue-50/30 border-blue-200",
        isEnabled && config.color === "purple" && "bg-purple-50/30 border-purple-200",
        isEnabled && config.color === "orange" && "bg-orange-50/30 border-orange-200"
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {config.emoji} {config.title}
            </CardTitle>
            <CardDescription>{config.subtitle}</CardDescription>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) =>
              onChange(type, { ...data[type], enabled: checked })
            }
          />
        </div>
      </CardHeader>

      {isEnabled && (
        <CardContent className="space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Quantas vezes?</Label>
              <Input
                type="number"
                placeholder="100"
                value={data[type]?.count || ""}
                onChange={(e) =>
                  onChange(type, { ...data[type], count: parseInt(e.target.value) || 0 })
                }
                className="h-12 text-lg"
              />
            </div>
            <div>
              <Label className="text-sm">Valor de cada</Label>
              <Input
                type="text"
                placeholder="R$ 2.739,05"
                value={data[type]?.value ? `R$ ${data[type]!.value!.toLocaleString("pt-BR")}` : ""}
                onChange={(e) => {
                  const amount = formatCurrency(e.target.value);
                  onChange(type, { ...data[type], value: amount });
                }}
                className="h-12 text-lg"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Dica: Se deixar vazio, o sistema não vai incluir no cálculo
          </p>
        </CardContent>
      )}
    </Card>
  );
}
