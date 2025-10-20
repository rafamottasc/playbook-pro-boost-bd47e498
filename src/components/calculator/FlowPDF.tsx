import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PaymentFlowData, CalculatedResult } from "@/hooks/usePaymentFlow";
import { format } from "date-fns";
import { formatCurrency, formatMoney } from "@/lib/utils";

// Helper function to load image and get its dimensions
async function loadImageWithDimensions(url: string): Promise<{ img: HTMLImageElement; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ img, width: img.width, height: img.height });
    img.onerror = reject;
    img.src = url;
  });
}

export async function generateFlowPDF(
  data: PaymentFlowData,
  result: CalculatedResult,
  correctorName: string,
  correctorCreci?: string | null
) {
  const doc = new jsPDF();
  
  // Adicionar logo COMARC (centralizada) - proporção automática
  const logoUrl = "/logo-comarc.png"; // Caminho relativo ao public
  try {
    const { img, width, height } = await loadImageWithDimensions(logoUrl);
    const aspectRatio = width / height;
    const desiredWidth = 40; // Largura desejada em mm
    const calculatedHeight = desiredWidth / aspectRatio; // Altura proporcional
    const xPosition = (210 - desiredWidth) / 2; // Centralizar (A4 tem 210mm de largura)
    
    doc.addImage(img, "PNG", xPosition, 10, desiredWidth, calculatedHeight);
  } catch (error) {
    console.warn("Logo não pôde ser carregada:", error);
  }

  // Título
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text("PROPOSTA DE PAGAMENTO", 105, 50, { align: "center" });

  // Nome do cliente
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(`Cliente: ${data.clientName}`, 15, 60);

  let yPosition = 70;

  // Dados do Imóvel (se preenchidos)
  const hasPropertyDetails =
    data.constructora || data.empreendimento || data.unidade || data.areaPrivativa;

  if (hasPropertyDetails) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO IMOVEL", 15, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    if (data.constructora) {
      doc.text(`Construtora: ${data.constructora}`, 15, yPosition);
      yPosition += 5;
    }
    if (data.empreendimento) {
      doc.text(`Empreendimento: ${data.empreendimento}`, 15, yPosition);
      yPosition += 5;
    }
    if (data.unidade) {
      doc.text(`Unidade: ${data.unidade}`, 15, yPosition);
      yPosition += 5;
    }
    if (data.areaPrivativa) {
      doc.text(`Área Privativa: ${data.areaPrivativa}m²`, 15, yPosition);
      yPosition += 5;
    }

    yPosition += 3;
  }

  // Entrega e valor total
  doc.setFontSize(10);
  const deliveryFormatted = data.deliveryDate
    ? format(new Date(data.deliveryDate + "T00:00:00"), "dd/MM/yyyy")
    : "Não informado";
  doc.text(`Entrega: ${deliveryFormatted}`, 15, yPosition);
  yPosition += 5;
  doc.text(
    `Valor Total: R$ ${formatMoney(data.propertyValue)}`,
    15,
    yPosition
  );
  yPosition += 10;

  // Tabela de condições
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("CONDICOES DE PAGAMENTO", 15, yPosition);
  yPosition += 5;

  const tableData: any[] = [];

  // Entrada
  const downPaymentInstallments = result.downPayment.installments || 1;
  const downPaymentValue = result.downPayment.installmentValue || result.downPayment.value;
  
  tableData.push([
    "Entrada",
    `${downPaymentInstallments}x`,
    `R$ ${formatMoney(downPaymentValue)}`,
    `${result.downPayment.percentage.toFixed(1)}%`,
  ]);

  // Início da Obra
  if (result.constructionStartPayment && result.constructionStartPayment.value > 0) {
    tableData.push([
      "Inicio da Obra",
      "1x",
      `R$ ${formatMoney(result.constructionStartPayment.value)}`,
      `${result.constructionStartPayment.percentage.toFixed(1)}%`,
    ]);
  }

  // Mensais
  if (result.monthly) {
    tableData.push([
      "Mensais",
      `${result.monthly.count}x`,
      `R$ ${formatMoney(result.monthly.value)}`,
      `${result.monthly.percentage.toFixed(1)}%`,
    ]);
  }

  // Semestrais
  if (result.semiannualReinforcement) {
    tableData.push([
      "Reforcos Semestrais",
      `${result.semiannualReinforcement.count}x`,
      `R$ ${formatMoney(result.semiannualReinforcement.value)}`,
      `${result.semiannualReinforcement.percentage.toFixed(1)}%`,
    ]);
  }

  // Anuais
  if (result.annualReinforcement) {
    tableData.push([
      "Reforcos Anuais",
      `${result.annualReinforcement.count}x`,
      `R$ ${formatMoney(result.annualReinforcement.value)}`,
      `${result.annualReinforcement.percentage.toFixed(1)}%`,
    ]);
  }

  // Chaves
  if (result.keysPayment && result.keysPayment.value > 0) {
    tableData.push([
      "Chaves",
      "1x",
      `R$ ${formatMoney(result.keysPayment.value)}`,
      `${result.keysPayment.percentage.toFixed(1)}%`,
    ]);
  }

  autoTable(doc, {
    startY: yPosition,
    head: [["Tipo", "Parcelas", "Valor", "% Total"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [0, 18, 45] },
  });

  // Total
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(
    `TOTAL: R$ ${formatMoney(result.totalPaid)} (${result.totalPercentage.toFixed(1)}%)`,
    15,
    finalY
  );

  // Distribuição Temporal
  finalY += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("DISTRIBUICAO TEMPORAL", 15, finalY);
  finalY += 5;

  autoTable(doc, {
    startY: finalY,
    head: [["Fase", "Valor", "Percentual"]],
    body: [
      [
        "Ate Entrega",
        `R$ ${formatMoney(result.timeline.totalUntilDelivery)}`,
        `${result.timeline.percentageUntilDelivery.toFixed(1)}%`
      ],
      [
        "Apos Entrega",
        `R$ ${formatMoney(result.timeline.totalAfterDelivery)}`,
        `${result.timeline.percentageAfterDelivery.toFixed(1)}%`
      ]
    ],
    theme: "grid",
    headStyles: { fillColor: [0, 18, 45] },
  });

  // Valores Adicionais (m² e CUB)
  let additionalY = (doc as any).lastAutoTable.finalY + 15;
  if (result.pricePerSqm || result.totalInCub) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    if (result.pricePerSqm) {
      doc.text(
        `Valor por m²: R$ ${formatCurrency(result.pricePerSqm)} / m²`,
        15,
        additionalY
      );
      additionalY += 5;
    }
    
    if (result.totalInCub && result.cubValue) {
      doc.text(
        `Valor em CUB: ${result.totalInCub.toFixed(5)} (Base: R$ ${formatCurrency(result.cubValue)})`,
        15,
        additionalY
      );
      additionalY += 5;
      doc.text(
        `*Valor corrigido pelo CUB/SC`,
        15,
        additionalY
      );
      additionalY += 5;
    }

    additionalY += 5;
  }

  // Rodapé centralizado
  const footerY = additionalY + 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);

  // Nome e CRECI (se disponível)
  let correctorInfo = correctorName;
  if (correctorCreci) {
    correctorInfo += ` - CRECI ${correctorCreci}`;
  }
  doc.text(correctorInfo, 105, footerY, { align: "center" });

  // Cargo
  doc.text("Consultor de Investimentos", 105, footerY + 5, { align: "center" });

  // Empresa
  doc.text("COMARC - Negócios Imobiliários", 105, footerY + 10, { align: "center" });

  // Separador
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(70, footerY + 15, 140, footerY + 15);

  // Data de geração
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy")}`, 
    105, 
    footerY + 20, 
    { align: "center" }
  );

  // Salvar PDF
  const fileName = `proposta_${data.clientName.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;
  doc.save(fileName);
}
