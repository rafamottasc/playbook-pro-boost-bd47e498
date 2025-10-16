import { useState } from "react";

export interface PaymentFlowData {
  propertyValue: number;
  deliveryDate: string;
  clientName: string;
  downPayment: number;
  monthly?: { enabled: boolean; count?: number; value?: number };
  semiannual?: { enabled: boolean; count?: number; value?: number };
  annual?: { enabled: boolean; count?: number; value?: number };
  keysPayment?: number;
  constructora?: string;
  empreendimento?: string;
  unidade?: string;
  areaPrivativa?: string;
}

export interface CalculatedResult {
  downPayment: { value: number; percentage: number };
  monthly?: { count: number; value: number; total: number; percentage: number };
  semiannual?: { count: number; value: number; total: number; percentage: number };
  annual?: { count: number; value: number; total: number; percentage: number };
  keysPayment?: { value: number; percentage: number };
  totalPaid: number;
  totalPercentage: number;
  isValid: boolean;
  warnings: string[];
}

export function usePaymentFlow() {
  const [data, setData] = useState<PaymentFlowData>({
    propertyValue: 0,
    deliveryDate: "",
    clientName: "",
    downPayment: 0,
    monthly: { enabled: false },
    semiannual: { enabled: false },
    annual: { enabled: false },
    keysPayment: 0,
  });

  const calculate = (): CalculatedResult => {
    let totalPaid = data.downPayment;
    
    const result: any = {
      downPayment: {
        value: data.downPayment,
        percentage: data.propertyValue > 0 ? (data.downPayment / data.propertyValue) * 100 : 0,
      },
      totalPaid: data.downPayment,
      warnings: [],
    };

    // Mensais
    if (data.monthly?.enabled && data.monthly.count && data.monthly.value) {
      const total = data.monthly.count * data.monthly.value;
      totalPaid += total;
      result.monthly = {
        count: data.monthly.count,
        value: data.monthly.value,
        total,
        percentage: data.propertyValue > 0 ? (total / data.propertyValue) * 100 : 0,
      };
    }

    // Semestrais
    if (data.semiannual?.enabled && data.semiannual.count && data.semiannual.value) {
      const total = data.semiannual.count * data.semiannual.value;
      totalPaid += total;
      result.semiannual = {
        count: data.semiannual.count,
        value: data.semiannual.value,
        total,
        percentage: data.propertyValue > 0 ? (total / data.propertyValue) * 100 : 0,
      };
    }

    // Anuais
    if (data.annual?.enabled && data.annual.count && data.annual.value) {
      const total = data.annual.count * data.annual.value;
      totalPaid += total;
      result.annual = {
        count: data.annual.count,
        value: data.annual.value,
        total,
        percentage: data.propertyValue > 0 ? (total / data.propertyValue) * 100 : 0,
      };
    }

    // Chaves
    if (data.keysPayment && data.keysPayment > 0) {
      totalPaid += data.keysPayment;
      result.keysPayment = {
        value: data.keysPayment,
        percentage: data.propertyValue > 0 ? (data.keysPayment / data.propertyValue) * 100 : 0,
      };
    }

    result.totalPaid = totalPaid;
    result.totalPercentage = data.propertyValue > 0 ? (totalPaid / data.propertyValue) * 100 : 0;

    // Validações
    if (data.propertyValue > 0) {
      const diff = Math.abs(result.totalPercentage - 100);
      if (diff > 5) {
        result.warnings.push(
          `Total calculado: ${result.totalPercentage.toFixed(1)}% (diferença de ${diff.toFixed(1)}% dos 100%)`
        );
      }
    }

    result.isValid = result.warnings.length === 0;

    return result;
  };

  const updateField = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  return { data, setData, updateField, calculate };
}
