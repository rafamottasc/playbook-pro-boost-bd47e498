import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency, formatMoney } from "@/lib/utils";
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
            R$ {formatMoney(result.totalPaid)}
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
                <span className="text-red-600">🚨 Falta R$ {formatMoney((propertyValue * remaining) / 100)}</span>
              </>
            )}
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-0">
          {result.downPayment.value > 0 && (
            <div className="py-2">
              <div className="text-sm text-muted-foreground mb-1">
                🏁 Entrada
              </div>
              <div className="text-sm font-semibold text-foreground">
                {result.downPayment.installments && result.downPayment.installments > 1 ? (
                  <>
                    {result.downPayment.installments}x de R${" "}
                    {formatMoney(result.downPayment.installmentValue || result.downPayment.value)} (
                    {result.downPayment.percentage.toFixed(1)}%)
                  </>
                ) : (
                  <>
                    R$ {formatMoney(result.downPayment.value)} (
                    {result.downPayment.percentage.toFixed(1)}%)
                  </>
                )}
              </div>
            </div>
          )}

          {result.constructionStartPayment && result.constructionStartPayment.value > 0 && (
            <div className="py-2">
              <div className="text-sm text-muted-foreground mb-1">
                🏗️ Início da Obra
              </div>
              <div className="text-sm font-semibold text-foreground">
                R$ {formatMoney(result.constructionStartPayment.value)} (
                {result.constructionStartPayment.percentage.toFixed(1)}%)
              </div>
            </div>
          )}

          {result.monthly && (
            <div className="py-2">
              <div className="text-sm text-muted-foreground mb-1">
                📆 Mensais
              </div>
              <div className="text-sm font-semibold text-foreground">
                {result.monthly.count}x de R${" "}
                {formatMoney(result.monthly.value)} (
                {result.monthly.percentage.toFixed(1)}%)
              </div>
            </div>
          )}

          {result.semiannualReinforcement && (
            <div className="py-2">
              <div className="text-sm text-muted-foreground mb-1">
                🎯 Reforços Semestrais
              </div>
              <div className="text-sm font-semibold text-foreground">
                {result.semiannualReinforcement.count}x de {" "}
                {((result.semiannualReinforcement.total / result.semiannualReinforcement.count / result.totalPaid * 100) * (result.totalPercentage / 100)).toFixed(1)}% = R$ {formatMoney(result.semiannualReinforcement.value)} ({result.semiannualReinforcement.percentage.toFixed(1)}%)
              </div>
            </div>
          )}

          {result.annualReinforcement && (
            <div className="py-2">
              <div className="text-sm text-muted-foreground mb-1">
                🎯 Reforços Anuais
              </div>
              <div className="text-sm font-semibold text-foreground">
                {result.annualReinforcement.count}x de {" "}
                {((result.annualReinforcement.total / result.annualReinforcement.count / result.totalPaid * 100) * (result.totalPercentage / 100)).toFixed(1)}% = R$ {formatMoney(result.annualReinforcement.value)} ({result.annualReinforcement.percentage.toFixed(1)}%)
              </div>
            </div>
          )}

          {result.keysPayment && result.keysPayment.value > 0 && (
            <div className="py-2">
              <div className="text-sm text-muted-foreground mb-1">
                🔑 Chaves
              </div>
              <div className="text-sm font-semibold text-foreground">
                R$ {formatMoney(result.keysPayment.value)} (
                {result.keysPayment.percentage.toFixed(1)}%)
              </div>
            </div>
          )}

          {result.pricePerSqm && (
            <div className="py-2">
              <div className="text-sm text-muted-foreground mb-1">
                📐 Valor total m²
              </div>
              <div className="text-sm font-semibold text-foreground">
                R$ {formatCurrency(result.pricePerSqm)}
              </div>
            </div>
          )}

          {result.totalInCub && (
            <div className="py-2">
              <div className="text-sm text-muted-foreground mb-1">
                📊 Valor total em CUB
              </div>
              <div className="text-sm font-semibold text-foreground">
                {result.totalInCub.toFixed(5)}
              </div>
              {result.cubWarning && (
                <p className="text-xs text-yellow-600 mt-1">
                  {result.cubWarning}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Distribuição Temporal */}
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          <p className="text-sm font-semibold text-foreground mb-3">📅 Distribuição Temporal</p>
          <div className="space-y-0">
            <div className="py-2">
              <div className="text-sm text-muted-foreground mb-1">
                Até Entrega
              </div>
              <div className="text-sm font-semibold text-foreground">
                R$ {formatMoney(result.timeline.totalUntilDelivery)} (
                {result.timeline.percentageUntilDelivery.toFixed(1)}%)
              </div>
            </div>
            <div className="py-2">
              <div className="text-sm text-muted-foreground mb-1">
                Após Entrega
              </div>
              <div className="text-sm font-semibold text-foreground">
                R$ {formatMoney(result.timeline.totalAfterDelivery)} (
                {result.timeline.percentageAfterDelivery.toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
