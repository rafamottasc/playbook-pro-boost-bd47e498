import { PaymentFlowData } from "@/hooks/usePaymentFlow";

/**
 * Migra propostas antigas para o novo formato com suporte a Ato e datas de vencimento
 * Garante retrocompatibilidade sem quebrar propostas existentes
 */
export function migrateProposalData(data: any): PaymentFlowData {
  // Se já está no novo formato, retorna como está
  if (data.downPayment?.ato !== undefined) {
    return data as PaymentFlowData;
  }

  // Migração: propostas antigas não têm campo "ato"
  const migratedData: PaymentFlowData = {
    ...data,
    downPayment: {
      ...data.downPayment,
      // Adicionar campos opcionais se não existirem
      firstDueDate: data.downPayment?.firstDueDate || data.constructionStartDate || undefined,
      ato: undefined, // Propostas antigas não têm Ato
    },
    constructionStartPayment: data.constructionStartPayment ? {
      ...data.constructionStartPayment,
      firstDueDate: data.constructionStartPayment.firstDueDate || undefined,
    } : undefined,
    monthly: data.monthly ? {
      ...data.monthly,
      firstDueDate: data.monthly.firstDueDate || undefined,
    } : undefined,
    semiannualReinforcement: data.semiannualReinforcement ? {
      ...data.semiannualReinforcement,
      firstDueDate: data.semiannualReinforcement.firstDueDate || undefined,
    } : undefined,
    annualReinforcement: data.annualReinforcement ? {
      ...data.annualReinforcement,
      firstDueDate: data.annualReinforcement.firstDueDate || undefined,
    } : undefined,
    keysPayment: data.keysPayment ? {
      ...data.keysPayment,
      firstDueDate: data.keysPayment.firstDueDate || undefined,
    } : undefined,
  };

  return migratedData;
}

/**
 * Valida se os dados da proposta estão no formato correto
 */
export function validateProposalData(data: PaymentFlowData): boolean {
  // Validações básicas
  if (!data.propertyValue || data.propertyValue <= 0) {
    return false;
  }

  if (!data.clientName || data.clientName.trim().length === 0) {
    return false;
  }

  if (!data.downPayment) {
    return false;
  }

  // Se tem Ato, validar estrutura
  if (data.downPayment.ato) {
    const ato = data.downPayment.ato;
    if (ato.type === 'percentage' && (!ato.percentage || ato.percentage <= 0)) {
      return false;
    }
    if (ato.type === 'value' && (!ato.value || ato.value <= 0)) {
      return false;
    }
  }

  return true;
}
