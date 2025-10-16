import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalculatedResult } from "@/hooks/usePaymentFlow";

interface FlowSummaryProps {
  result: CalculatedResult;
}

export function FlowSummary({ result }: FlowSummaryProps) {
  const isValid = Math.abs(result.totalPercentage - 100) < 5;

  return (
    <Card
      className={cn(
        "sticky top-6 animate-fade-in",
        isValid ? "border-green-500 bg-green-50/20" : "border-yellow-500 bg-yellow-50/20"
      )}
    >
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          ✨ RESUMO AUTOMÁTICO
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Calculado */}
        <div className="p-4 bg-card rounded-lg border-2 border-primary">
          <p className="text-sm text-muted-foreground">Total Calculado</p>
          <p className="text-3xl font-bold text-primary">
            R$ {result.totalPaid.toLocaleString("pt-BR")}
          </p>
          <p
            className={cn(
              "text-sm font-medium",
              isValid ? "text-green-600" : "text-yellow-600"
            )}
          >
            {isValid
              ? "✅ Valores fecham 100%"
              : `⚠️ ${result.totalPercentage.toFixed(1)}%`}
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          {result.downPayment.value > 0 && (
            <div className="flex justify-between text-sm">
              <span>🏁 Entrada:</span>
              <span className="font-medium">
                R$ {result.downPayment.value.toLocaleString("pt-BR")} (
                {result.downPayment.percentage.toFixed(1)}%)
              </span>
            </div>
          )}

          {result.monthly && (
            <div className="flex justify-between text-sm">
              <span>📆 Mensais:</span>
              <span className="font-medium">
                {result.monthly.count}x de R${" "}
                {result.monthly.value.toLocaleString("pt-BR")} (
                {result.monthly.percentage.toFixed(1)}%)
              </span>
            </div>
          )}

          {result.semiannual && (
            <div className="flex justify-between text-sm">
              <span>🎯 Semestrais:</span>
              <span className="font-medium">
                {result.semiannual.count}x de R${" "}
                {result.semiannual.value.toLocaleString("pt-BR")} (
                {result.semiannual.percentage.toFixed(1)}%)
              </span>
            </div>
          )}

          {result.annual && (
            <div className="flex justify-between text-sm">
              <span>🎯 Anuais:</span>
              <span className="font-medium">
                {result.annual.count}x de R${" "}
                {result.annual.value.toLocaleString("pt-BR")} (
                {result.annual.percentage.toFixed(1)}%)
              </span>
            </div>
          )}

          {result.keysPayment && result.keysPayment.value > 0 && (
            <div className="flex justify-between text-sm">
              <span>🔑 Chaves:</span>
              <span className="font-medium">
                R$ {result.keysPayment.value.toLocaleString("pt-BR")} (
                {result.keysPayment.percentage.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            {result.warnings.map((warning, index) => (
              <p key={index} className="text-xs text-yellow-700">
                {warning}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
