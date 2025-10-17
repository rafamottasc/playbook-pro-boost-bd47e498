import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PaymentFlowData, CalculatedResult } from "@/hooks/usePaymentFlow";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

export async function generateFlowPDF(
  data: PaymentFlowData,
  result: CalculatedResult,
  correctorName: string
) {
  const doc = new jsPDF();
  
  // Adicionar logo COMARC (top left) - proporção corrigida
  const logoUrl = "/src/assets/logo-comarc.png";
  try {
    doc.addImage(logoUrl, "PNG", 15, 10, 45, 15);
  } catch (error) {
    console.log("Logo não carregado, continuando sem logo");
  }

  // Data no topo direito
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Data: ${format(new Date(), "dd/MM/yyyy")}`, 195, 15, { align: "right" });

  // Título
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text("PROPOSTA DE PAGAMENTO", 105, 35, { align: "center" });

  // Nome do cliente
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(`Cliente: ${data.clientName}`, 15, 45);

  let yPosition = 55;

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
    `Valor Total: R$ ${data.propertyValue.toLocaleString("pt-BR")}`,
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
    `R$ ${downPaymentValue.toLocaleString("pt-BR")}`,
    `${result.downPayment.percentage.toFixed(1)}%`,
  ]);

  // Início da Obra
  if (result.constructionStartPayment && result.constructionStartPayment.value > 0) {
    tableData.push([
      "Inicio da Obra",
      "1x",
      `R$ ${result.constructionStartPayment.value.toLocaleString("pt-BR")}`,
      `${result.constructionStartPayment.percentage.toFixed(1)}%`,
    ]);
  }

  // Mensais
  if (result.monthly) {
    tableData.push([
      "Mensais",
      `${result.monthly.count}x`,
      `R$ ${result.monthly.value.toLocaleString("pt-BR")}`,
      `${result.monthly.percentage.toFixed(1)}%`,
    ]);
  }

  // Semestrais
  if (result.semiannualReinforcement) {
    tableData.push([
      "Reforcos Semestrais",
      `${result.semiannualReinforcement.count}x`,
      `R$ ${result.semiannualReinforcement.value.toLocaleString("pt-BR")}`,
      `${result.semiannualReinforcement.percentage.toFixed(1)}%`,
    ]);
  }

  // Anuais
  if (result.annualReinforcement) {
    tableData.push([
      "Reforcos Anuais",
      `${result.annualReinforcement.count}x`,
      `R$ ${result.annualReinforcement.value.toLocaleString("pt-BR")}`,
      `${result.annualReinforcement.percentage.toFixed(1)}%`,
    ]);
  }

  // Chaves
  if (result.keysPayment && result.keysPayment.value > 0) {
    tableData.push([
      "Chaves",
      "1x",
      `R$ ${result.keysPayment.value.toLocaleString("pt-BR")}`,
      `${result.keysPayment.percentage.toFixed(1)}%`,
    ]);
  }

  autoTable(doc, {
    startY: yPosition,
    head: [["Tipo", "Parcelas", "Valor", "% Total"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Total
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(
    `TOTAL: R$ ${result.totalPaid.toLocaleString("pt-BR")} (${result.totalPercentage.toFixed(1)}%)`,
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
        `R$ ${result.timeline.totalUntilDelivery.toLocaleString("pt-BR")}`,
        `${result.timeline.percentageUntilDelivery.toFixed(1)}%`
      ],
      [
        "Apos Entrega",
        `R$ ${result.timeline.totalAfterDelivery.toLocaleString("pt-BR")}`,
        `${result.timeline.percentageAfterDelivery.toFixed(1)}%`
      ]
    ],
    theme: "grid",
    headStyles: { fillColor: [52, 152, 219] },
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
    }

    additionalY += 5;
  }

  // Rodapé
  const footerY = additionalY;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, 15, footerY);
  doc.text(`Corretor: ${correctorName}`, 15, footerY + 5);
  doc.text("Validade: 30 dias", 15, footerY + 10);

  // Salvar PDF
  const fileName = `proposta_${data.clientName.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;
  doc.save(fileName);
}
