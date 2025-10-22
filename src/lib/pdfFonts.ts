import { jsPDF } from "jspdf";

// Função para adicionar fontes com suporte a UTF-8 ao jsPDF
export async function addCustomFonts(doc: jsPDF) {
  // Por enquanto, vamos usar a fonte padrão 'times' que tem melhor suporte a acentos
  // do que 'helvetica'. Em produção, você pode adicionar fontes customizadas.
  doc.setFont("times", "normal");
}
