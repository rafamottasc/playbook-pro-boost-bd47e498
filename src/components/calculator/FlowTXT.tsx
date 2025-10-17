import { format } from "date-fns";
import { PaymentFlowData } from "@/hooks/usePaymentFlow";
import { CalculatedResult } from "@/hooks/usePaymentFlow";
import { formatCurrency, formatMoney } from "@/lib/utils";

export function generateFlowTXT(
  data: PaymentFlowData,
  result: CalculatedResult,
  correctorName: string
): void {
  const currentDate = format(new Date(), "dd/MM/yyyy");
  const currentTime = format(new Date(), "HH:mm");
  const deliveryDate = data.deliveryDate ? format(new Date(data.deliveryDate), "dd/MM/yyyy") : "Não informado";

  let txt = `🏢 PROPOSTA DE PAGAMENTO - COMARC\n`;
  txt += `━━━━━━━\n\n`;

  txt += `📅 Data: ${currentDate}\n`;
  if (data.clientName) {
    txt += `👤 Cliente: ${data.clientName}\n`;
  }
  txt += `\n`;

  txt += `━━━━━━━\n`;
  txt += `🏠 DADOS DO IMÓVEL\n`;
  txt += `━━━━━━━\n`;
  
  if (data.constructora) {
    txt += `Construtora: ${data.constructora}\n`;
  }
  if (data.empreendimento) {
    txt += `Empreendimento: ${data.empreendimento}\n`;
  }
  if (data.unidade) {
    txt += `Unidade: ${data.unidade}\n`;
  }
  if (data.areaPrivativa) {
    txt += `Área Privativa: ${data.areaPrivativa}m²\n`;
  }
  if (data.deliveryDate) {
    txt += `Entrega: ${deliveryDate}\n`;
  }
  
  txt += `Valor Total: R$ ${formatMoney(data.propertyValue)}\n\n`;

  txt += `━━━━━━━\n`;
  txt += `💰 CONDIÇÕES DE PAGAMENTO\n`;
  txt += `━━━━━━━\n\n`;

  // Entrada
  if (result.downPayment.value > 0) {
    const installmentValue = result.downPayment.installmentValue || result.downPayment.value;
    txt += `🏁 Entrada\n`;
    txt += `   ${result.downPayment.installments}x de R$ ${formatMoney(installmentValue)}`;
    txt += ` (${result.downPayment.percentage.toFixed(1)}%)\n\n`;
  }

  // Início da Obra
  if (result.constructionStartPayment && result.constructionStartPayment.value > 0) {
    txt += `🏗️ Início da Obra\n`;
    txt += `   1x de R$ ${formatMoney(result.constructionStartPayment.value)}`;
    txt += ` (${result.constructionStartPayment.percentage.toFixed(1)}%)\n\n`;
  }

  // Mensais
  if (result.monthly && result.monthly.total > 0) {
    txt += `📅 Mensais\n`;
    txt += `   ${result.monthly.count}x de R$ ${formatMoney(result.monthly.value)}`;
    txt += ` (${result.monthly.percentage.toFixed(1)}%)\n\n`;
  }

  // Reforços Semestrais
  if (result.semiannualReinforcement && result.semiannualReinforcement.total > 0) {
    txt += `💎 Reforços Semestrais\n`;
    txt += `   ${result.semiannualReinforcement.count}x de R$ ${formatMoney(result.semiannualReinforcement.value)}`;
    txt += ` (${result.semiannualReinforcement.percentage.toFixed(1)}%)\n\n`;
  }

  // Reforços Anuais
  if (result.annualReinforcement && result.annualReinforcement.total > 0) {
    txt += `💎 Reforços Anuais\n`;
    txt += `   ${result.annualReinforcement.count}x de R$ ${formatMoney(result.annualReinforcement.value)}`;
    txt += ` (${result.annualReinforcement.percentage.toFixed(1)}%)\n\n`;
  }

  // Chaves
  if (result.keysPayment && result.keysPayment.value > 0) {
    txt += `🔑 Chaves\n`;
    txt += `   1x de R$ ${formatMoney(result.keysPayment.value)}`;
    txt += ` (${result.keysPayment.percentage.toFixed(1)}%)\n\n`;
  }

  txt += `━━━━━━━\n`;
  txt += `📊 TOTAL: R$ ${formatMoney(result.totalPaid)} (${result.totalPercentage.toFixed(1)}%)\n`;
  txt += `━━━━━━━\n\n`;

  txt += `📅 DISTRIBUIÇÃO TEMPORAL\n`;
  txt += `━━━━━━━\n`;
  txt += `✓ Até Entrega: R$ ${formatMoney(result.timeline.totalUntilDelivery)}`;
  txt += ` (${result.timeline.percentageUntilDelivery.toFixed(1)}%)\n`;
  txt += `✓ Após Entrega: R$ ${formatMoney(result.timeline.totalAfterDelivery)}`;
  txt += ` (${result.timeline.percentageAfterDelivery.toFixed(1)}%)\n\n`;

  // Valores adicionais (m² e CUB)
  if (result.pricePerSqm || result.totalInCub) {
    txt += `━━━━━━━\n`;
    txt += `📊 VALORES ADICIONAIS\n`;
    txt += `━━━━━━━\n`;
    
    if (result.pricePerSqm) {
      txt += `📐 Valor por m²: R$ ${formatCurrency(result.pricePerSqm)} / m²\n`;
    }
    
    if (result.totalInCub && result.cubValue) {
      txt += `📊 Valor em CUB: ${result.totalInCub.toFixed(5)} (Base: R$ ${formatCurrency(result.cubValue)})\n`;
      txt += `*Valor corrigido pelo CUB/SC\n`;
    }
    
    if (result.cubWarning) {
      txt += `\n⚠️ ${result.cubWarning}\n`;
    }
    
    txt += `\n`;
  }

  txt += `━━━━━━━\n`;
  txt += `ℹ️ Informações\n`;
  txt += `━━━━━━━\n`;
  txt += `Gerado em: ${currentDate} às ${currentTime}\n`;
  txt += `Corretor: ${correctorName}\n`;
  txt += `Validade: 30 dias\n\n`;

  txt += `COMARC - Negócios Imobiliários\n`;

  // Create and download the file
  const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  
  const clientName = data.clientName ? data.clientName.replace(/\s+/g, "_") : "cliente";
  const dateStr = format(new Date(), "yyyyMMdd_HHmmss");
  link.download = `proposta_${clientName}_${dateStr}.txt`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
