

## Diagnostico do bug

Analisei o fluxo completo da calculadora (`usePaymentFlow.tsx`, `Calculator.tsx`, `PaymentBlock.tsx`, `BasicInfoSection.tsx`, `FlowSummary.tsx`).

### Causa raiz

A funcao `getFirstPaymentDate()` (linha 200) coleta TODAS as datas de primeiro vencimento (Ato, Entrada, Inicio Obra, Mensais) e retorna a **MAIS ANTIGA**. Esse valor unico (`monthsUntilDelivery`) e depois usado como "regua" para tudo:

```
monthsUntilDelivery = differenceInMonths(deliveryDate, MENOR_data)
```

E em seguida na distribuicao temporal (linha 326-348), o codigo usa essa regua unica para calcular quantas mensais cabem ate a entrega:

```
monthlyUntilDelivery = Math.min(monthly.count, monthsUntilDelivery)
```

### Cenario do usuario

- Ato hoje (Abr/2026)
- Primeira parcela mensal: mes 7 (Nov/2026)
- Entrega das chaves: Dez/2030
- 356 parcelas mensais de R$ 5.000

O que o codigo faz:

1. `firstPaymentDate` = data do Ato (hoje) — porque e a mais antiga
2. `monthsUntilDelivery` = ~56 meses (Abr/26 → Dez/30) **a partir de hoje**
3. Mas as mensais so comecam no mes 7. Logo, o periodo real disponivel para mensais e **56 − 7 = 49 meses**, nao 56.
4. Os reforcos (semestrais e anuais) tambem usam `monthsUntilDelivery / 12` para distribuir, ignorando o seu proprio `firstDueDate`.
5. No modo automatico (saldo das chaves ou auto-calculate de mensais), o codigo distribui valores como se houvesse mais tempo disponivel do que realmente ha — gerando os 2 parcelas a mais (R$ 10.000) que o usuario percebeu.

Resultado: a calculadora trata "data de hoje" como inicio implicito de todos os pagamentos, mesmo quando o usuario configura `firstDueDate` especifico para cada secao.

### Bugs adicionais correlatos

- `BasicInfoSection.tsx` (linha 27-50) duplica a mesma logica errada para mostrar "X meses ate a entrega" no banner azul — tambem usando a data mais antiga.
- A distribuicao de reforcos semestrais/anuais (linhas 336-348) usa `yearsUntilDelivery` derivado do `monthsUntilDelivery` global, sem respeitar o `firstDueDate` proprio de cada reforco.
- O `monthly.afterDelivery` pode aparecer como zero quando, na realidade, parte das mensais cai depois da entrega (porque a regua "infla" o tempo disponivel).

## Solucao proposta

### 1. Fazer cada secao respeitar seu proprio `firstDueDate`

Em `usePaymentFlow.tsx`, separar a regua por tipo de pagamento:

```
monthsForMonthly  = differenceInMonths(deliveryDate, monthly.firstDueDate)
monthsForSemi     = differenceInMonths(deliveryDate, semiannualReinforcement.firstDueDate)
monthsForAnnual   = differenceInMonths(deliveryDate, annualReinforcement.firstDueDate)
```

E usar essas reguas individuais na distribuicao temporal (`monthlyUntilDelivery`, `semiannualUntilDelivery`, `annualUntilDelivery`).

### 2. Corrigir `monthsUntilDelivery` global

Manter um `monthsUntilDelivery` apenas para exibicao geral (do primeiro pagamento ate a entrega), mas **nao** usa-lo para distribuir mensais/reforcos.

### 3. Validacao de coerencia

Se `firstDueDate + count > deliveryDate` para mensais, marcar quantas caem apos a entrega corretamente (em vez de zerar). Adicionar warning se o usuario configurar mais parcelas do que cabe no intervalo real.

### 4. Sincronizar `BasicInfoSection.tsx`

Usar a mesma logica corrigida (importar helper compartilhado) para o banner "X meses ate a entrega" refletir a realidade.

### 5. Modo "auto-calculate" (saldo das chaves e mensais)

Quando o usuario ativa auto-calculate, recalcular usando o periodo real (`firstDueDate → deliveryDate`) em vez do `monthsUntilDelivery` global. Isso elimina os ~R$ 10.000 a mais que apareciam no cenario do usuario.

### Detalhes tecnicos

**Arquivo a editar:** `src/hooks/usePaymentFlow.tsx`
- Refatorar `getFirstPaymentDate()` para tambem expor `getMonthsUntilDelivery(firstDueDate)`.
- Substituir os 3 calculos de `*UntilDelivery` (linhas 326, 336, 343) para usarem o `firstDueDate` proprio de cada secao.
- Manter `monthsUntilDelivery` global apenas para `result.timeline.monthsUntilDelivery` (usado em UI).

**Arquivo a editar:** `src/components/calculator/BasicInfoSection.tsx`
- Substituir `calculateMonthsUntilDelivery()` por chamada ao helper exportado de `usePaymentFlow.tsx`.

**Sem mudancas de schema** — apenas correcao da logica de calculo client-side.

