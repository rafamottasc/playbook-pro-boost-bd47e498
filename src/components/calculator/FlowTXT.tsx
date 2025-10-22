import { format } from "date-fns";
import { PaymentFlowData } from "@/hooks/usePaymentFlow";
import { CalculatedResult } from "@/hooks/usePaymentFlow";
import { formatCurrency, formatMoney } from "@/lib/utils";

export function generateFlowTXT(
  data: PaymentFlowData,
  result: CalculatedResult,
  correctorName: string,
  correctorCreci?: string | null
): void {
  const currentDate = format(new Date(), "dd/MM/yyyy");
  const currentTime = format(new Date(), "HH:mm");
  const deliveryDate = data.deliveryDate ? format(new Date(data.deliveryDate), "dd/MM/yyyy") : "Não informado";

  let txt = `PROPOSTA DE PAGAMENTO - COMARC\n`;
  txt += `=================================\n\n`;

  txt += `Data: ${currentDate}\n`;
  if (data.clientName) {
    txt += `Cliente: ${data.clientName}\n`;
  }
  txt += `\n`;

  txt += `=================================\n`;
  txt += `DADOS DO IMOVEL\n`;
  txt += `=================================\n`;
  
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

  txt += `=================================\n`;
  txt += `CONDICOES DE PAGAMENTO\n`;
  txt += `=================================\n\n`;

  // Ato
  if (result.downPayment.atoValue && result.downPayment.atoValue > 0) {
    txt += `Ato\n`;
    txt += `   1x de R$ ${formatMoney(result.downPayment.atoValue)}`;
    txt += ` (${result.downPayment.atoPercentage?.toFixed(1)}%)`;
    if (data.downPayment.ato?.firstDueDate) {
      txt += ` - Venc: ${format(new Date(data.downPayment.ato.firstDueDate + "T00:00:00"), "dd/MM/yyyy")}`;
    }
    txt += `\n\n`;
  }

  // Entrada
  if (result.downPayment.downPaymentParceladoValue && result.downPayment.downPaymentParceladoValue > 0) {
    const installmentValue = result.downPayment.installmentValue || result.downPayment.downPaymentParceladoValue;
    txt += `Entrada\n`;
    txt += `   ${result.downPayment.installments}x de R$ ${formatMoney(installmentValue)}`;
    txt += ` (${result.downPayment.downPaymentParceladoPercentage?.toFixed(1)}%)`;
    if (data.downPayment.firstDueDate) {
      txt += ` - Venc: ${format(new Date(data.downPayment.firstDueDate + "T00:00:00"), "dd/MM/yyyy")}`;
    }
    txt += `\n\n`;
  } else if (!result.downPayment.atoValue || result.downPayment.atoValue === 0) {
    const installmentValue = result.downPayment.installmentValue || result.downPayment.value;
    txt += `Entrada\n`;
    txt += `   ${result.downPayment.installments}x de R$ ${formatMoney(installmentValue)}`;
    txt += ` (${result.downPayment.percentage.toFixed(1)}%)`;
    if (data.downPayment.firstDueDate) {
      txt += ` - Venc: ${format(new Date(data.downPayment.firstDueDate + "T00:00:00"), "dd/MM/yyyy")}`;
    }
    txt += `\n\n`;
  }

  // Inicio da Obra
  if (result.constructionStartPayment && result.constructionStartPayment.value > 0) {
    txt += `Inicio da Obra\n`;
    txt += `   1x de R$ ${formatMoney(result.constructionStartPayment.value)}`;
    txt += ` (${result.constructionStartPayment.percentage.toFixed(1)}%)`;
    if (data.constructionStartPayment?.firstDueDate) {
      txt += ` - Venc: ${format(new Date(data.constructionStartPayment.firstDueDate + "T00:00:00"), "dd/MM/yyyy")}`;
    }
    txt += `\n\n`;
  }

  // Mensais
  if (result.monthly && result.monthly.total > 0) {
    txt += `Mensais\n`;
    txt += `   ${result.monthly.count}x de R$ ${formatMoney(result.monthly.value)}`;
    txt += ` (${result.monthly.percentage.toFixed(1)}%)`;
    if (data.monthly?.firstDueDate) {
      txt += ` - Venc: ${format(new Date(data.monthly.firstDueDate + "T00:00:00"), "dd/MM/yyyy")}`;
    }
    txt += `\n\n`;
  }

  // Reforcos Semestrais
  if (result.semiannualReinforcement && result.semiannualReinforcement.total > 0) {
    txt += `Reforcos Semestrais\n`;
    txt += `   ${result.semiannualReinforcement.count}x de R$ ${formatMoney(result.semiannualReinforcement.value)}`;
    txt += ` (${result.semiannualReinforcement.percentage.toFixed(1)}%)`;
    if (data.semiannualReinforcement?.firstDueDate) {
      txt += ` - Venc: ${format(new Date(data.semiannualReinforcement.firstDueDate + "T00:00:00"), "dd/MM/yyyy")}`;
    }
    txt += `\n\n`;
  }

  // Reforcos Anuais
  if (result.annualReinforcement && result.annualReinforcement.total > 0) {
    txt += `Reforcos Anuais\n`;
    txt += `   ${result.annualReinforcement.count}x de R$ ${formatMoney(result.annualReinforcement.value)}`;
    txt += ` (${result.annualReinforcement.percentage.toFixed(1)}%)`;
    if (data.annualReinforcement?.firstDueDate) {
      txt += ` - Venc: ${format(new Date(data.annualReinforcement.firstDueDate + "T00:00:00"), "dd/MM/yyyy")}`;
    }
    txt += `\n\n`;
  }

  // Chaves
  if (result.keysPayment && result.keysPayment.value > 0) {
    txt += `Chaves\n`;
    txt += `   1x de R$ ${formatMoney(result.keysPayment.value)}`;
    txt += ` (${result.keysPayment.percentage.toFixed(1)}%)`;
    const keysVencDate = data.keysPayment?.firstDueDate || data.deliveryDate;
    if (keysVencDate) {
      txt += ` - Venc: ${format(new Date(keysVencDate + "T00:00:00"), "dd/MM/yyyy")}`;
    }
    txt += `\n\n`;
  }

  txt += `=================================\n`;
  txt += `TOTAL: R$ ${formatMoney(result.totalPaid)} (${result.totalPercentage.toFixed(1)}%)\n`;
  txt += `=================================\n\n`;

  txt += `DISTRIBUICAO TEMPORAL\n`;
  txt += `=================================\n`;
  txt += `Ate Entrega: R$ ${formatMoney(result.timeline.totalUntilDelivery)}`;
  txt += ` (${result.timeline.percentageUntilDelivery.toFixed(1)}%)\n`;
  txt += `Apos Entrega: R$ ${formatMoney(result.timeline.totalAfterDelivery)}`;
  txt += ` (${result.timeline.percentageAfterDelivery.toFixed(1)}%)\n\n`;

  // Valores adicionais (m2 e CUB)
  if (result.pricePerSqm || result.totalInCub) {
    txt += `=================================\n`;
    txt += `VALORES ADICIONAIS\n`;
    txt += `=================================\n`;
    
    if (result.pricePerSqm) {
      txt += `Valor por m2: R$ ${formatCurrency(result.pricePerSqm)} / m2\n`;
    }
    
    if (result.totalInCub && result.cubValue) {
      txt += `Valor em CUB: ${result.totalInCub.toFixed(5)} (Base: R$ ${formatCurrency(result.cubValue)})\n`;
      txt += `*Valor corrigido pelo CUB/SC\n`;
    }
    
    if (result.cubWarning) {
      txt += `\n${result.cubWarning}\n`;
    }
    
    txt += `\n`;
  }

  txt += `=================================\n`;
  
  // Nome e CRECI
  let correctorInfo = correctorName;
  if (correctorCreci) {
    correctorInfo += ` - CRECI ${correctorCreci}`;
  }
  txt += `${correctorInfo}\n`;
  
  // Cargo
  txt += `Consultor de Investimentos\n`;
  
  // Empresa
  txt += `COMARC - Negócios Imobiliários\n\n`;
  
  // Separador
  txt += `=================================\n`;
  
  // Data de geracao
  txt += `Gerado em: ${currentDate}\n`;

  // Converter para Windows-1252 (Latin-1) para compatibilidade com visualizadores de texto no Brasil
  // Isso garante que acentos sejam exibidos corretamente em apps móveis
  const encoder = new TextEncoder();
  const utf8Array = encoder.encode(txt);
  
  // Criar blob como Windows-1252
  const blob = new Blob([utf8Array], { type: "text/plain;charset=windows-1252" });
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
