import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency, formatMoney, formatCurrencyWithExchange } from "@/lib/utils";
import { CalculatedResult } from "@/hooks/usePaymentFlow";
import type { Currency } from "@/hooks/usePaymentFlow";

interface FlowSummaryProps {
  result: CalculatedResult;
  propertyValue: number;
  currency?: Currency;
}

export function FlowSummary({ result, propertyValue, currency }: FlowSummaryProps) {
  const currentCurrency = currency || { code: 'BRL' as const, symbol: 'R$', rate: 1, name: 'Real Brasileiro' };
  
  const formatValue = (value: number, showSymbol: boolean = false) => {
    if (currentCurrency.code === 'BRL') {
      return showSymbol ? `R$ ${formatCurrency(value)}` : formatCurrency(value);
    }
    return formatCurrencyWithExchange(value, currentCurrency.code, currentCurrency.rate, showSymbol);
  };
  const isValid = Math.abs(result.totalPercentage - 100) < 5;
  const remaining = Math.max(0, 100 - result.totalPercentage);

  return (
    <Card className="animate-fade-in border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          RESUMO PROPOSTA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Total Calculado */}
        <div className="p-3 bg-card rounded-lg border border-border">
          {currentCurrency.code !== 'BRL' && (
            <p className="text-xs text-muted-foreground mb-1">
              Cotação: 1 {currentCurrency.code} = R$ {currentCurrency.rate.toFixed(2)}
            </p>
          )}
          <p className="text-sm text-muted-foreground">Total Calculado</p>
          <p className="text-3xl font-bold text-primary">
            {currentCurrency.symbol} {formatValue(result.totalPaid)}
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
                <span className="text-red-600">🚨 Falta {currentCurrency.symbol} {formatValue((propertyValue * remaining) / 100)}</span>
              </>
            )}
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-0">
          {/* Ato */}
          {result.downPayment.atoValue && result.downPayment.atoValue > 0 && (
            <div className="py-1.5">
              <div className="text-sm text-muted-foreground mb-0.5">
                💰 Ato (Pagamento Único)
              </div>
              <div className="text-sm font-semibold text-foreground">
                {currentCurrency.symbol} {formatValue(result.downPayment.atoValue)} (
                {result.downPayment.atoPercentage?.toFixed(1)}%)
              </div>
            </div>
          )}

          {/* Entrada Parcelada */}
          {result.downPayment.downPaymentParceladoValue && result.downPayment.downPaymentParceladoValue > 0 && (
            <div className="py-1.5">
              <div className="text-sm text-muted-foreground mb-0.5">
                🏁 Entrada
              </div>
              <div className="text-sm font-semibold text-foreground">
                {result.downPayment.installments && result.downPayment.installments > 1 ? (
                  <>
                    {result.downPayment.installments}x de {currentCurrency.symbol}{" "}
                    {formatValue(result.downPayment.installmentValue || result.downPayment.downPaymentParceladoValue)} (
                    {result.downPayment.downPaymentParceladoPercentage?.toFixed(1)}%)
                  </>
                ) : (
                  <>
                    {currentCurrency.symbol} {formatValue(result.downPayment.downPaymentParceladoValue)} (
                    {result.downPayment.downPaymentParceladoPercentage?.toFixed(1)}%)
                  </>
                )}
              </div>
            </div>
          )}

          {/* Entrada Normal (quando não tem Ato) */}
          {(!result.downPayment.atoValue || result.downPayment.atoValue === 0) && 
            (!result.downPayment.downPaymentParceladoValue || result.downPayment.downPaymentParceladoValue === 0) && 
            result.downPayment.value > 0 && (
            <div className="py-1.5">
              <div className="text-sm text-muted-foreground mb-0.5">
                🏁 Entrada
              </div>
              <div className="text-sm font-semibold text-foreground">
                {result.downPayment.installments && result.downPayment.installments > 1 ? (
                  <>
                    {result.downPayment.installments}x de {currentCurrency.symbol}{" "}
                    {formatValue(result.downPayment.installmentValue || result.downPayment.value)} (
                    {result.downPayment.percentage.toFixed(1)}%)
                  </>
                ) : (
                  <>
                    {currentCurrency.symbol} {formatValue(result.downPayment.value)} (
                    {result.downPayment.percentage.toFixed(1)}%)
                  </>
                )}
              </div>
            </div>
          )}

          {result.constructionStartPayment && (
            <div className="py-1.5">
              <div className="text-sm text-muted-foreground mb-0.5">
                🏗️ Início da Obra
              </div>
              <div className="text-sm font-semibold text-foreground">
                {currentCurrency.symbol} {formatValue(result.constructionStartPayment.value)} (
                {result.constructionStartPayment.percentage.toFixed(1)}%)
              </div>
            </div>
          )}

          {result.monthly && (
            <div className="py-1.5">
              <div className="text-sm text-muted-foreground mb-0.5">
                💸 Mensais
              </div>
              <div className="text-sm font-semibold text-foreground">
                {result.monthly.count}x de {" "}
                {((result.monthly.total / result.monthly.count / result.totalPaid * 100) * (result.totalPercentage / 100)).toFixed(1)}% = {currentCurrency.symbol} {formatValue(result.monthly.value)} ({result.monthly.percentage.toFixed(1)}%)
              </div>
            </div>
          )}

          {result.semiannualReinforcement && (
            <div className="py-1.5">
              <div className="text-sm text-muted-foreground mb-0.5">
                🎯 Reforços Semestrais
              </div>
              <div className="text-sm font-semibold text-foreground">
                {result.semiannualReinforcement.count}x de {" "}
                {((result.semiannualReinforcement.total / result.semiannualReinforcement.count / result.totalPaid * 100) * (result.totalPercentage / 100)).toFixed(1)}% = {currentCurrency.symbol} {formatValue(result.semiannualReinforcement.value)} ({result.semiannualReinforcement.percentage.toFixed(1)}%)
              </div>
            </div>
          )}

          {result.annualReinforcement && (
            <div className="py-1.5">
              <div className="text-sm text-muted-foreground mb-0.5">
                🎯 Reforços Anuais
              </div>
              <div className="text-sm font-semibold text-foreground">
                {result.annualReinforcement.count}x de {" "}
                {((result.annualReinforcement.total / result.annualReinforcement.count / result.totalPaid * 100) * (result.totalPercentage / 100)).toFixed(1)}% = {currentCurrency.symbol} {formatValue(result.annualReinforcement.value)} ({result.annualReinforcement.percentage.toFixed(1)}%)
              </div>
            </div>
          )}

          {result.keysPayment && result.keysPayment.value > 0 && (
            <div className="py-1.5">
              <div className="text-sm text-muted-foreground mb-0.5">
                🔑 Chaves
              </div>
              <div className="text-sm font-semibold text-foreground">
                {currentCurrency.symbol} {formatValue(result.keysPayment.value)} (
                {result.keysPayment.percentage.toFixed(1)}%)
              </div>
            </div>
          )}

          {result.pricePerSqm && (
            <div className="py-1.5">
              <div className="text-sm text-muted-foreground mb-0.5">
                📐 Valor total m²
              </div>
              <div className="text-sm font-semibold text-foreground">
                {currentCurrency.symbol} {formatValue(result.pricePerSqm)}
              </div>
            </div>
          )}

          {result.totalInCub && (
            <div className="py-1.5">
              <div className="text-sm text-muted-foreground mb-0.5">
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
        <div className="p-3 bg-muted/30 rounded-lg border border-border">
          <p className="text-sm font-semibold text-foreground mb-2">📅 Distribuição Temporal</p>
          <div className="space-y-0">
            <div className="py-1.5">
              <div className="text-sm text-muted-foreground mb-0.5">
                Até Entrega
              </div>
              <div className="text-sm font-semibold text-foreground">
                {currentCurrency.symbol} {formatValue(result.timeline.totalUntilDelivery)} (
                {result.timeline.percentageUntilDelivery.toFixed(1)}%)
              </div>
            </div>
            <div className="py-1.5">
              <div className="text-sm text-muted-foreground mb-0.5">
                Após Entrega
              </div>
              <div className="text-sm font-semibold text-foreground">
                {currentCurrency.symbol} {formatValue(result.timeline.totalAfterDelivery)} (
                {result.timeline.percentageAfterDelivery.toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
