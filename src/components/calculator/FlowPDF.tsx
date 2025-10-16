import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PaymentFlowData, CalculatedResult } from "@/hooks/usePaymentFlow";
import { format } from "date-fns";

export async function generateFlowPDF(
  data: PaymentFlowData,
  result: CalculatedResult,
  correctorName: string
) {
  const doc = new jsPDF();
  
  // Adicionar logo COMARC (top left)
  const logoUrl = "/src/assets/logo-comarc.png";
  try {
    doc.addImage(logoUrl, "PNG", 15, 10, 40, 15);
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
    doc.text("📋 DADOS DO IMÓVEL", 15, yPosition);
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
      doc.text(`Área Privativa: ${data.areaPrivativa}`, 15, yPosition);
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
  doc.text("📊 CONDIÇÕES DE PAGAMENTO", 15, yPosition);
  yPosition += 5;

  const tableData: any[] = [];

  // Entrada
  tableData.push([
    "🏁 Entrada",
    "1x",
    `R$ ${result.downPayment.value.toLocaleString("pt-BR")}`,
    `${result.downPayment.percentage.toFixed(1)}%`,
  ]);

  // Mensais
  if (result.monthly) {
    tableData.push([
      "📆 Mensais",
      `${result.monthly.count}x`,
      `R$ ${result.monthly.value.toLocaleString("pt-BR")}`,
      `${result.monthly.percentage.toFixed(1)}%`,
    ]);
  }

  // Semestrais
  if (result.semiannual) {
    tableData.push([
      "🎯 Semestrais",
      `${result.semiannual.count}x`,
      `R$ ${result.semiannual.value.toLocaleString("pt-BR")}`,
      `${result.semiannual.percentage.toFixed(1)}%`,
    ]);
  }

  // Anuais
  if (result.annual) {
    tableData.push([
      "🎯 Anuais",
      `${result.annual.count}x`,
      `R$ ${result.annual.value.toLocaleString("pt-BR")}`,
      `${result.annual.percentage.toFixed(1)}%`,
    ]);
  }

  // Chaves
  if (result.keysPayment && result.keysPayment.value > 0) {
    tableData.push([
      "🔑 Chaves",
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
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(
    `✅ TOTAL: R$ ${result.totalPaid.toLocaleString("pt-BR")} (${result.totalPercentage.toFixed(1)}%)`,
    15,
    finalY
  );

  // Rodapé
  const footerY = finalY + 15;
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
