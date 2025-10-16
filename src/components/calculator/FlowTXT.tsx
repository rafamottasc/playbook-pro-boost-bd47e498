import { format } from "date-fns";
import { PaymentFlowData } from "@/hooks/usePaymentFlow";
import { CalculatedResult } from "@/hooks/usePaymentFlow";

export function generateFlowTXT(
  data: PaymentFlowData,
  result: CalculatedResult,
  correctorName: string
): void {
  const currentDate = format(new Date(), "dd/MM/yyyy");
  const currentTime = format(new Date(), "HH:mm");
  const deliveryDate = data.deliveryDate ? format(new Date(data.deliveryDate), "dd/MM/yyyy") : "Não informado";

  let txt = `═══════════════════════════════════\n`;
  txt += `🏢 PROPOSTA DE PAGAMENTO - COMARC\n`;
  txt += `═══════════════════════════════════\n\n`;

  txt += `📅 Data: ${currentDate}\n`;
  txt += `👤 Cliente: ${data.clientName || "Não informado"}\n\n`;

  txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  txt += `🏠 DADOS DO IMÓVEL\n`;
  txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  txt += `Construtora: ${data.constructora || "Não informado"}\n`;
  txt += `Empreendimento: ${data.empreendimento || "Não informado"}\n`;
  txt += `Unidade: ${data.unidade || "Não informado"}\n`;
  txt += `Área Privativa: ${data.areaPrivativa || "Não informado"}\n`;
  txt += `Entrega: ${deliveryDate}\n`;
  txt += `Valor Total: R$ ${data.propertyValue.toLocaleString("pt-BR")}\n\n`;

  txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  txt += `💰 CONDIÇÕES DE PAGAMENTO\n`;
  txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Entrada
  if (result.downPayment.value > 0) {
    const installmentValue = result.downPayment.installmentValue || result.downPayment.value;
    txt += `🏁 Entrada\n`;
    txt += `   ${result.downPayment.installments}x de R$ ${installmentValue.toLocaleString("pt-BR")}`;
    txt += ` (${result.downPayment.percentage.toFixed(1)}%)\n\n`;
  }

  // Início da Obra
  if (result.constructionStartPayment && result.constructionStartPayment.value > 0) {
    txt += `🏗️ Início da Obra\n`;
    txt += `   1x de R$ ${result.constructionStartPayment.value.toLocaleString("pt-BR")}`;
    txt += ` (${result.constructionStartPayment.percentage.toFixed(1)}%)\n\n`;
  }

  // Mensais
  if (result.monthly && result.monthly.total > 0) {
    txt += `📅 Mensais\n`;
    txt += `   ${result.monthly.count}x de R$ ${result.monthly.value.toLocaleString("pt-BR")}`;
    txt += ` (${result.monthly.percentage.toFixed(1)}%)\n\n`;
  }

  // Reforços Semestrais
  if (result.semiannualReinforcement && result.semiannualReinforcement.total > 0) {
    txt += `💎 Reforços Semestrais\n`;
    txt += `   ${result.semiannualReinforcement.count}x de R$ ${result.semiannualReinforcement.value.toLocaleString("pt-BR")}`;
    txt += ` (${result.semiannualReinforcement.percentage.toFixed(1)}%)\n\n`;
  }

  // Reforços Anuais
  if (result.annualReinforcement && result.annualReinforcement.total > 0) {
    txt += `💎 Reforços Anuais\n`;
    txt += `   ${result.annualReinforcement.count}x de R$ ${result.annualReinforcement.value.toLocaleString("pt-BR")}`;
    txt += ` (${result.annualReinforcement.percentage.toFixed(1)}%)\n\n`;
  }

  // Chaves
  if (result.keysPayment && result.keysPayment.value > 0) {
    txt += `🔑 Chaves\n`;
    txt += `   1x de R$ ${result.keysPayment.value.toLocaleString("pt-BR")}`;
    txt += ` (${result.keysPayment.percentage.toFixed(1)}%)\n\n`;
  }

  txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  txt += `📊 TOTAL: R$ ${result.totalPaid.toLocaleString("pt-BR")} (${result.totalPercentage.toFixed(1)}%)\n`;
  txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  txt += `📅 DISTRIBUIÇÃO TEMPORAL\n`;
  txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  txt += `✓ Até Entrega: R$ ${result.timeline.totalUntilDelivery.toLocaleString("pt-BR")}`;
  txt += ` (${result.timeline.percentageUntilDelivery.toFixed(1)}%)\n`;
  txt += `✓ Após Entrega: R$ ${result.timeline.totalAfterDelivery.toLocaleString("pt-BR")}`;
  txt += ` (${result.timeline.percentageAfterDelivery.toFixed(1)}%)\n\n`;

  txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  txt += `ℹ️ Informações\n`;
  txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  txt += `Gerado em: ${currentDate} às ${currentTime}\n`;
  txt += `Corretor: ${correctorName}\n`;
  txt += `Validade: 30 dias\n\n`;

  txt += `═══════════════════════════════════\n`;
  txt += `COMARC - Corretores Associados\n`;
  txt += `═══════════════════════════════════\n`;

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
