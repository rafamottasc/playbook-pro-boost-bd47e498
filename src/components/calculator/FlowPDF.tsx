import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PaymentFlowData, CalculatedResult } from "@/hooks/usePaymentFlow";
import { format } from "date-fns";
import { formatCurrency, formatMoney } from "@/lib/utils";

// Helper function to load image and get its dimensions with timeout
async function loadImageWithDimensions(url: string, timeoutMs: number = 2000): Promise<{ img: HTMLImageElement; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    
    // Timeout para não travar indefinidamente
    const timeout = setTimeout(() => {
      console.warn('Logo load timeout - continuando sem logo');
      resolve(null);
    }, timeoutMs);
    
    img.onload = () => {
      clearTimeout(timeout);
      resolve({ img, width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      console.warn('Erro ao carregar logo - continuando sem logo');
      resolve(null);
    };
    
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
  const logoData = await loadImageWithDimensions(logoUrl, 2000); // 2 segundos de timeout
  if (logoData) {
    const { img, width, height } = logoData;
    const aspectRatio = width / height;
    const desiredWidth = 40; // Largura desejada em mm
    const calculatedHeight = desiredWidth / aspectRatio; // Altura proporcional
    const xPosition = (210 - desiredWidth) / 2; // Centralizar (A4 tem 210mm de largura)
    
    doc.addImage(img, "PNG", xPosition, 10, desiredWidth, calculatedHeight);
  } else {
    console.warn("Logo não carregada - PDF gerado sem logo");
  }

  // Título - usando Times com codificação UTF-8
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.setFont("times", "bold");
  // Garantir que o texto seja interpretado como UTF-8
  const title = "PROPOSTA DE PAGAMENTO";
  doc.text(title, 105, 50, { align: "center" });

  // Nome do cliente - garantir UTF-8
  doc.setFontSize(14);
  doc.setFont("times", "normal");
  const clientText = `Cliente: ${data.clientName}`;
  doc.text(clientText, 15, 60);

  let yPosition = 70;

  // Dados do Imóvel (se preenchidos)
  const hasPropertyDetails =
    data.constructora || data.empreendimento || data.unidade || data.areaPrivativa;

  if (hasPropertyDetails) {
    doc.setFontSize(12);
    doc.setFont("times", "bold");
    doc.text("DADOS DO IMÓVEL", 15, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont("times", "normal");

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
    if (data.descritivoImovel) {
      doc.text(`Descritivo: ${data.descritivoImovel}`, 15, yPosition);
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
  doc.setFont("times", "bold");
  doc.text("CONDIÇÕES DE PAGAMENTO", 15, yPosition);
  yPosition += 5;

  // Verificar se existe alguma data preenchida
  const hasAnyDate = !!(
    data.downPayment.ato?.firstDueDate ||
    data.downPayment.firstDueDate ||
    data.constructionStartPayment?.firstDueDate ||
    data.monthly?.firstDueDate ||
    data.semiannualReinforcement?.firstDueDate ||
    data.annualReinforcement?.firstDueDate ||
    data.keysPayment?.firstDueDate
  );

  const tableData: any[] = [];
  const tableHeaders = hasAnyDate 
    ? ["Tipo", "Parcelas", "Valor", "% Total", "1º Vencimento"]
    : ["Tipo", "Parcelas", "Valor", "% Total"];

  // Ato (se existir)
  if (result.downPayment.atoValue && result.downPayment.atoValue > 0) {
    const atoDate = data.downPayment.ato?.firstDueDate 
      ? format(new Date(data.downPayment.ato.firstDueDate + "T00:00:00"), "dd/MM/yyyy")
      : "";
    
    const atoRow = [
      "Ato",
      "1x",
      `R$ ${formatMoney(result.downPayment.atoValue)}`,
      `${result.downPayment.atoPercentage?.toFixed(1)}%`,
    ];
    
    if (hasAnyDate) {
      atoRow.push(atoDate);
    }
    
    tableData.push(atoRow);
  }

  // Entrada Parcelada
  if (result.downPayment.downPaymentParceladoValue && result.downPayment.downPaymentParceladoValue > 0) {
    const downPaymentInstallments = result.downPayment.installments || 1;
    const downPaymentValue = result.downPayment.installmentValue || result.downPayment.downPaymentParceladoValue;
    const entradaDate = data.downPayment.firstDueDate
      ? format(new Date(data.downPayment.firstDueDate + "T00:00:00"), "dd/MM/yyyy")
      : "";
    
    const entradaRow = [
      "Entrada",
      `${downPaymentInstallments}x`,
      `R$ ${formatMoney(downPaymentValue)}`,
      `${result.downPayment.downPaymentParceladoPercentage?.toFixed(1)}%`,
    ];
    
    if (hasAnyDate) {
      entradaRow.push(entradaDate);
    }
    
    tableData.push(entradaRow);
  } else if (!result.downPayment.atoValue || result.downPayment.atoValue === 0) {
    // Se não tem Ato, mostrar entrada normal
    const downPaymentInstallments = result.downPayment.installments || 1;
    const downPaymentValue = result.downPayment.installmentValue || result.downPayment.value;
    const entradaDate = data.downPayment.firstDueDate
      ? format(new Date(data.downPayment.firstDueDate + "T00:00:00"), "dd/MM/yyyy")
      : "";
    
    const entradaRow = [
      "Entrada",
      `${downPaymentInstallments}x`,
      `R$ ${formatMoney(downPaymentValue)}`,
      `${result.downPayment.percentage.toFixed(1)}%`,
    ];
    
    if (hasAnyDate) {
      entradaRow.push(entradaDate);
    }
    
    tableData.push(entradaRow);
  }

  // Início da Obra
  if (result.constructionStartPayment && result.constructionStartPayment.value > 0) {
    const obraDate = data.constructionStartPayment?.firstDueDate
      ? format(new Date(data.constructionStartPayment.firstDueDate + "T00:00:00"), "dd/MM/yyyy")
      : "";
    
    const obraRow = [
      "Início da Obra",
      "1x",
      `R$ ${formatMoney(result.constructionStartPayment.value)}`,
      `${result.constructionStartPayment.percentage.toFixed(1)}%`,
    ];
    
    if (hasAnyDate) {
      obraRow.push(obraDate);
    }
    
    tableData.push(obraRow);
  }

  // Mensais
  if (result.monthly) {
    const monthlyDate = data.monthly?.firstDueDate
      ? format(new Date(data.monthly.firstDueDate + "T00:00:00"), "dd/MM/yyyy")
      : "";
    
    const monthlyRow = [
      "Mensais",
      `${result.monthly.count}x`,
      `R$ ${formatMoney(result.monthly.value)}`,
      `${result.monthly.percentage.toFixed(1)}%`,
    ];
    
    if (hasAnyDate) {
      monthlyRow.push(monthlyDate);
    }
    
    tableData.push(monthlyRow);
  }

  // Semestrais
  if (result.semiannualReinforcement) {
    const semiDate = data.semiannualReinforcement?.firstDueDate
      ? format(new Date(data.semiannualReinforcement.firstDueDate + "T00:00:00"), "dd/MM/yyyy")
      : "";
    
    const semiRow = [
      "Reforços Semestrais",
      `${result.semiannualReinforcement.count}x`,
      `R$ ${formatMoney(result.semiannualReinforcement.value)}`,
      `${result.semiannualReinforcement.percentage.toFixed(1)}%`,
    ];
    
    if (hasAnyDate) {
      semiRow.push(semiDate);
    }
    
    tableData.push(semiRow);
  }

  // Anuais
  if (result.annualReinforcement) {
    const annualDate = data.annualReinforcement?.firstDueDate
      ? format(new Date(data.annualReinforcement.firstDueDate + "T00:00:00"), "dd/MM/yyyy")
      : "";
    
    const annualRow = [
      "Reforços Anuais",
      `${result.annualReinforcement.count}x`,
      `R$ ${formatMoney(result.annualReinforcement.value)}`,
      `${result.annualReinforcement.percentage.toFixed(1)}%`,
    ];
    
    if (hasAnyDate) {
      annualRow.push(annualDate);
    }
    
    tableData.push(annualRow);
  }

  // Chaves
  if (result.keysPayment && result.keysPayment.value > 0) {
    const keysDate = data.keysPayment?.firstDueDate
      ? format(new Date(data.keysPayment.firstDueDate + "T00:00:00"), "dd/MM/yyyy")
      : data.deliveryDate
        ? format(new Date(data.deliveryDate + "T00:00:00"), "dd/MM/yyyy")
        : "";
    
    const keysRow = [
      "Chaves",
      "1x",
      `R$ ${formatMoney(result.keysPayment.value)}`,
      `${result.keysPayment.percentage.toFixed(1)}%`,
    ];
    
    if (hasAnyDate) {
      keysRow.push(keysDate);
    }
    
    tableData.push(keysRow);
  }

  autoTable(doc, {
    startY: yPosition,
    head: [tableHeaders],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [9, 41, 89] },
    styles: { font: "times" }, // Usar Times para suporte a acentos
  });

  // Total
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont("times", "bold");
  doc.text(
    `TOTAL: R$ ${formatMoney(result.totalPaid)} (${result.totalPercentage.toFixed(1)}%)`,
    15,
    finalY
  );

  // Distribuição Temporal
  finalY += 15;
  doc.setFontSize(12);
  doc.setFont("times", "bold");
  doc.text("DISTRIBUIÇÃO TEMPORAL", 15, finalY);
  finalY += 5;

  autoTable(doc, {
    startY: finalY,
    head: [["Fase", "Valor", "Percentual"]],
    body: [
      [
        "Até Entrega",
        `R$ ${formatMoney(result.timeline.totalUntilDelivery)}`,
        `${result.timeline.percentageUntilDelivery.toFixed(1)}%`
    ],
    [
      "Após Entrega",
        `R$ ${formatMoney(result.timeline.totalAfterDelivery)}`,
        `${result.timeline.percentageAfterDelivery.toFixed(1)}%`
      ]
    ],
    theme: "grid",
    headStyles: { fillColor: [9, 41, 89] },
    styles: { font: "times" }, // Usar Times para suporte a acentos
  });

  // Valores Adicionais (m² e CUB)
  let additionalY = (doc as any).lastAutoTable.finalY + 15;
  if (result.pricePerSqm || result.totalInCub) {
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    
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
  doc.setFont("times", "normal");
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
