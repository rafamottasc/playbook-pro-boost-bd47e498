import { jsPDF } from "jspdf";

// Função para adicionar fonte Roboto com suporte completo a UTF-8 ao jsPDF
export async function addCustomFonts(doc: jsPDF) {
  // Usando a fonte padrão 'times' que tem suporte razoável a acentos
  // A fonte 'times' do jsPDF inclui mapeamento para caracteres latinos com acentos
  // Esta é a solução mais simples e confiável sem precisar incorporar arquivos .ttf
  doc.setFont("times", "normal");
}

// Alternativa: Se precisar de fonte customizada no futuro, você pode:
// 1. Baixar o arquivo .ttf da fonte
// 2. Converter para base64 usando: https://base64.guru/converter/encode/file
// 3. Adicionar ao jsPDF usando doc.addFileToVFS() e doc.addFont()
