import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalculatedResult } from "@/hooks/usePaymentFlow";

interface FlowSummaryProps {
  result: CalculatedResult;
}

export function FlowSummary({ result }: FlowSummaryProps) {
  const isValid = Math.abs(result.totalPercentage - 100) < 5;
  const remaining = Math.max(0, 100 - result.totalPercentage);

  return (
    <Card
      className={cn(
        "sticky top-0 animate-fade-in",
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
              result.totalPercentage >= 99 && result.totalPercentage <= 101
                ? "text-green-600"
                : result.totalPercentage > 101
                ? "text-red-600"
                : "text-yellow-600"
            )}
          >
            {result.totalPercentage >= 99 && result.totalPercentage <= 101
              ? "✅ Valores fecham 100%"
              : result.totalPercentage > 101
              ? `⚠️ ${result.totalPercentage.toFixed(1)}% 🚨 Acima de 100%`
              : `⚠️ ${result.totalPercentage.toFixed(1)}% 🚨 Falta ${remaining.toFixed(1)}%`
            }
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          {result.downPayment.value > 0 && (
            <div className="flex justify-between text-sm">
              <span>🏁 Entrada:</span>
              <span className="font-medium">
                {result.downPayment.installments && result.downPayment.installments > 1 ? (
                  // Parcelada
                  <>
                    {result.downPayment.installments}x de R${" "}
                    {(result.downPayment.value / result.downPayment.installments).toLocaleString("pt-BR")} (
                    {result.downPayment.percentage.toFixed(1)}%)
                  </>
                ) : (
                  // À vista
                  <>
                    R$ {result.downPayment.value.toLocaleString("pt-BR")} (
                    {result.downPayment.percentage.toFixed(1)}%)
                  </>
                )}
              </span>
            </div>
          )}

          {result.constructionStartPayment && result.constructionStartPayment.value > 0 && (
            <div className="flex justify-between text-sm">
              <span>🏗️ Início da Obra:</span>
              <span className="font-medium">
                R$ {result.constructionStartPayment.value.toLocaleString("pt-BR")} (
                {result.constructionStartPayment.percentage.toFixed(1)}%)
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

          {result.semiannualReinforcement && (
            <div className="flex justify-between text-sm">
              <span>🎯 Reforços Semestrais:</span>
              <span className="font-medium">
                {result.semiannualReinforcement.count}x de {" "}
                {((result.semiannualReinforcement.total / result.semiannualReinforcement.count / result.totalPaid * 100) * (result.totalPercentage / 100)).toFixed(1)}% = {" "}
                R$ {result.semiannualReinforcement.value.toLocaleString("pt-BR")} (
                {result.semiannualReinforcement.percentage.toFixed(1)}% do total)
              </span>
            </div>
          )}

          {result.annualReinforcement && (
            <div className="flex justify-between text-sm">
              <span>🎯 Reforços Anuais:</span>
              <span className="font-medium">
                {result.annualReinforcement.count}x de {" "}
                {((result.annualReinforcement.total / result.annualReinforcement.count / result.totalPaid * 100) * (result.totalPercentage / 100)).toFixed(1)}% = {" "}
                R$ {result.annualReinforcement.value.toLocaleString("pt-BR")} (
                {result.annualReinforcement.percentage.toFixed(1)}% do total)
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

        {/* Distribuição Temporal */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
          <p className="text-sm font-semibold text-blue-900 mb-3">📅 Distribuição Temporal</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">Até Entrega:</span>
              <span className="font-semibold text-blue-900">
                R$ {result.timeline.totalUntilDelivery.toLocaleString("pt-BR")} (
                {result.timeline.percentageUntilDelivery.toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-700">Após Entrega:</span>
              <span className="font-semibold text-purple-900">
                R$ {result.timeline.totalAfterDelivery.toLocaleString("pt-BR")} (
                {result.timeline.percentageAfterDelivery.toFixed(1)}%)
              </span>
            </div>
          </div>
          {result.timeline.percentageUntilDelivery < 50 && (
            <p className="text-xs text-yellow-700 mt-2 p-2 bg-yellow-50 rounded">
              ⚠️ Menos de 50% até entrega - risco maior para o cliente
            </p>
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
