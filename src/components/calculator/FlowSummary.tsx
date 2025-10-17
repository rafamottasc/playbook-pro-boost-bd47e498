import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { CalculatedResult } from "@/hooks/usePaymentFlow";

interface FlowSummaryProps {
  result: CalculatedResult;
  propertyValue: number;
}

export function FlowSummary({ result, propertyValue }: FlowSummaryProps) {
  const isValid = Math.abs(result.totalPercentage - 100) < 5;
  const remaining = Math.max(0, 100 - result.totalPercentage);

  return (
    <Card className="animate-fade-in border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          ✨ RESUMO PROPOSTA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Calculado */}
        <div className="p-4 bg-card rounded-lg border border-border">
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
            {result.totalPercentage >= 99 && result.totalPercentage <= 101 ? (
              <span className="text-green-600">✅ Valores fecham 100%</span>
            ) : result.totalPercentage > 101 ? (
              <span className="text-red-600">⚠️ {result.totalPercentage.toFixed(1)}% 🚨 Acima de 100%</span>
            ) : (
              <>
                <span className="text-green-600">⚠️ Pago {result.totalPercentage.toFixed(1)}%</span>
                {" "}
                <span className="text-red-600">🚨 Falta R$ {((propertyValue * remaining) / 100).toLocaleString("pt-BR")}</span>
              </>
            )}
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
                {Math.round((result.semiannualReinforcement.total / result.semiannualReinforcement.count / result.totalPaid * 100) * (result.totalPercentage / 100))}% = R$ {result.semiannualReinforcement.value.toLocaleString("pt-BR")} ({result.semiannualReinforcement.percentage.toFixed(1)}%)
              </span>
            </div>
          )}

          {result.annualReinforcement && (
            <div className="flex justify-between text-sm">
              <span>🎯 Reforços Anuais:</span>
              <span className="font-medium">
                {result.annualReinforcement.count}x de {" "}
                {Math.round((result.annualReinforcement.total / result.annualReinforcement.count / result.totalPaid * 100) * (result.totalPercentage / 100))}% = R$ {result.annualReinforcement.value.toLocaleString("pt-BR")} ({result.annualReinforcement.percentage.toFixed(1)}%)
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

          {result.pricePerSqm && (
            <div className="flex justify-between text-sm">
              <span>📐 Valor total m²:</span>
              <span className="font-medium">
                R$ {formatCurrency(result.pricePerSqm)}
              </span>
            </div>
          )}

          {result.totalInCub && (
            <>
              <div className="flex justify-between text-sm">
                <span>📊 Valor total CUB:</span>
                <span className="font-medium">
                  {result.totalInCub.toFixed(5)}
                </span>
              </div>
              {result.cubWarning && (
                <p className="text-xs text-yellow-600 mt-1">
                  {result.cubWarning}
                </p>
              )}
            </>
          )}
        </div>

        {/* Distribuição Temporal */}
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          <p className="text-sm font-semibold text-foreground mb-3">📅 Distribuição Temporal</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Até Entrega:</span>
              <span className="font-semibold text-foreground">
                R$ {result.timeline.totalUntilDelivery.toLocaleString("pt-BR")} (
                {result.timeline.percentageUntilDelivery.toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Após Entrega:</span>
              <span className="font-semibold text-foreground">
                R$ {result.timeline.totalAfterDelivery.toLocaleString("pt-BR")} (
                {result.timeline.percentageAfterDelivery.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
