import { useState } from "react";
import { differenceInMonths, parseISO } from "date-fns";

export interface PaymentFlowData {
  propertyValue: number;
  constructionStartDate: string;
  deliveryDate: string;
  clientName: string;
  downPayment: {
    type: 'percentage' | 'value';
    percentage?: number;
    value?: number;
    installments?: number;
  };
  constructionStartPayment?: {
    type: 'percentage' | 'value';
    percentage?: number;
    value?: number;
  };
  monthly?: { 
    enabled: boolean; 
    count?: number; 
    value?: number;
    autoCalculate?: boolean;
  };
  semiannualReinforcement?: { 
    enabled: boolean; 
    count?: number; 
    value?: number;
    percentage?: number;
    autoCalculate?: boolean;
  };
  annualReinforcement?: { 
    enabled: boolean; 
    count?: number; 
    value?: number;
    percentage?: number;
    autoCalculate?: boolean;
  };
  keysPayment?: {
    type: 'percentage' | 'value';
    percentage?: number;
    value?: number;
  };
  constructora?: string;
  empreendimento?: string;
  unidade?: string;
  areaPrivativa?: string;
}

export interface CalculatedResult {
  downPayment: { 
    value: number; 
    percentage: number;
    installments?: number;
    installmentValue?: number;
  };
  constructionStartPayment?: { 
    value: number; 
    percentage: number;
  };
  monthly?: { 
    count: number; 
    value: number; 
    total: number; 
    percentage: number;
    untilDelivery: number;
    afterDelivery: number;
  };
  semiannualReinforcement?: { 
    count: number; 
    value: number; 
    total: number; 
    percentage: number;
    untilDelivery: number;
    afterDelivery: number;
  };
  annualReinforcement?: { 
    count: number; 
    value: number; 
    total: number; 
    percentage: number;
    untilDelivery: number;
    afterDelivery: number;
  };
  keysPayment?: { 
    value: number; 
    percentage: number;
  };
  timeline: {
    monthsUntilDelivery: number;
    totalUntilDelivery: number;
    totalAfterDelivery: number;
    percentageUntilDelivery: number;
    percentageAfterDelivery: number;
  };
  totalPaid: number;
  totalPercentage: number;
  isValid: boolean;
  warnings: string[];
}

export function usePaymentFlow() {
  const [data, setData] = useState<PaymentFlowData>({
    propertyValue: 0,
    constructionStartDate: "",
    deliveryDate: "",
    clientName: "",
    downPayment: { type: 'percentage', percentage: 10, value: 0 },
    monthly: { enabled: false, autoCalculate: true },
    semiannualReinforcement: { enabled: false, percentage: 8 },
    annualReinforcement: { enabled: false, percentage: 8 },
    keysPayment: { type: 'percentage', percentage: 8, value: 0 },
  });

  const calculate = (): CalculatedResult => {
    // 1. Calcular meses até entrega
    let monthsUntilDelivery = 0;
    if (data.constructionStartDate && data.deliveryDate) {
      try {
        const start = parseISO(data.constructionStartDate);
        const end = parseISO(data.deliveryDate);
        monthsUntilDelivery = Math.max(0, differenceInMonths(end, start));
      } catch (e) {
        monthsUntilDelivery = 0;
      }
    }

    // 2. Calcular entrada
    let downPaymentValue = 0;
    if (data.downPayment.type === 'percentage' && data.downPayment.percentage) {
      downPaymentValue = (data.downPayment.percentage / 100) * data.propertyValue;
    } else if (data.downPayment.type === 'value' && data.downPayment.value) {
      downPaymentValue = data.downPayment.value;
    }

    const downPaymentInstallmentValue = data.downPayment.installments && data.downPayment.installments > 1
      ? downPaymentValue / data.downPayment.installments
      : undefined;

    // 2.5 Calcular início da obra
    let constructionStartValue = 0;
    if (data.constructionStartPayment) {
      if (data.constructionStartPayment.type === 'percentage' && data.constructionStartPayment.percentage) {
        constructionStartValue = (data.constructionStartPayment.percentage / 100) * data.propertyValue;
      } else if (data.constructionStartPayment.type === 'value' && data.constructionStartPayment.value) {
        constructionStartValue = data.constructionStartPayment.value;
      }
    }

    // 3. Calcular reforços
    let totalSemiannual = 0;
    let semiannualValue = 0;
    if (data.semiannualReinforcement?.enabled && data.semiannualReinforcement.count) {
      if (data.semiannualReinforcement.value) {
        semiannualValue = data.semiannualReinforcement.value;
      } else if (data.semiannualReinforcement.percentage) {
        semiannualValue = (data.semiannualReinforcement.percentage / 100) * data.propertyValue;
      }
      totalSemiannual = semiannualValue * data.semiannualReinforcement.count;
    }

    let totalAnnual = 0;
    let annualValue = 0;
    if (data.annualReinforcement?.enabled && data.annualReinforcement.count) {
      if (data.annualReinforcement.value) {
        annualValue = data.annualReinforcement.value;
      } else if (data.annualReinforcement.percentage) {
        annualValue = (data.annualReinforcement.percentage / 100) * data.propertyValue;
      }
      totalAnnual = annualValue * data.annualReinforcement.count;
    }

    // 4. Calcular chaves
    let keysValue = 0;
    if (data.keysPayment) {
      if (data.keysPayment.type === 'percentage' && data.keysPayment.percentage) {
        keysValue = (data.keysPayment.percentage / 100) * data.propertyValue;
      } else if (data.keysPayment.type === 'value' && data.keysPayment.value) {
        keysValue = data.keysPayment.value;
      }
    }

    // 5. Calcular parcelas mensais
    let monthlyValue = 0;
    let totalMonthly = 0;
    if (data.monthly?.enabled && data.monthly.count) {
      if (data.monthly.autoCalculate) {
        const remainingBalance = data.propertyValue - downPaymentValue - constructionStartValue - totalSemiannual - totalAnnual - keysValue;
        monthlyValue = remainingBalance / data.monthly.count;
      } else if (data.monthly.value) {
        monthlyValue = data.monthly.value;
      }
      totalMonthly = monthlyValue * data.monthly.count;
    }

    // 6. Distribuir parcelas mensais até/após entrega
    const monthlyUntilDelivery = data.monthly?.enabled && data.monthly.count
      ? Math.min(data.monthly.count, monthsUntilDelivery)
      : 0;
    const monthlyAfterDelivery = data.monthly?.enabled && data.monthly.count
      ? data.monthly.count - monthlyUntilDelivery
      : 0;

    // 7. Distribuir reforços até/após entrega
    const yearsUntilDelivery = monthsUntilDelivery / 12;
    
    const semiannualUntilDelivery = data.semiannualReinforcement?.enabled && data.semiannualReinforcement.count
      ? Math.min(data.semiannualReinforcement.count, Math.floor(yearsUntilDelivery * 2))
      : 0;
    const semiannualAfterDelivery = data.semiannualReinforcement?.enabled && data.semiannualReinforcement.count
      ? data.semiannualReinforcement.count - semiannualUntilDelivery
      : 0;

    const annualUntilDelivery = data.annualReinforcement?.enabled && data.annualReinforcement.count
      ? Math.min(data.annualReinforcement.count, Math.floor(yearsUntilDelivery))
      : 0;
    const annualAfterDelivery = data.annualReinforcement?.enabled && data.annualReinforcement.count
      ? data.annualReinforcement.count - annualUntilDelivery
      : 0;

    // 8. Calcular totais temporais
    const totalUntilDelivery = 
      downPaymentValue +
      constructionStartValue +
      (monthlyValue * monthlyUntilDelivery) +
      (semiannualValue * semiannualUntilDelivery) +
      (annualValue * annualUntilDelivery);

    const totalAfterDelivery = 
      (monthlyValue * monthlyAfterDelivery) +
      (semiannualValue * semiannualAfterDelivery) +
      (annualValue * annualAfterDelivery) +
      keysValue;

    const totalPaid = downPaymentValue + constructionStartValue + totalMonthly + totalSemiannual + totalAnnual + keysValue;
    const totalPercentage = data.propertyValue > 0 ? (totalPaid / data.propertyValue) * 100 : 0;
    const percentageUntilDelivery = data.propertyValue > 0 ? (totalUntilDelivery / data.propertyValue) * 100 : 0;
    const percentageAfterDelivery = data.propertyValue > 0 ? (totalAfterDelivery / data.propertyValue) * 100 : 0;

    // 9. Montar resultado
    const result: CalculatedResult = {
      downPayment: {
        value: downPaymentValue,
        percentage: data.propertyValue > 0 ? (downPaymentValue / data.propertyValue) * 100 : 0,
        installments: data.downPayment.installments || 1,
        installmentValue: downPaymentInstallmentValue,
      },
      timeline: {
        monthsUntilDelivery,
        totalUntilDelivery,
        totalAfterDelivery,
        percentageUntilDelivery,
        percentageAfterDelivery,
      },
      totalPaid,
      totalPercentage,
      warnings: [],
      isValid: true,
    };

    // Adicionar parcelas mensais ao resultado
    if (data.monthly?.enabled && data.monthly.count) {
      result.monthly = {
        count: data.monthly.count,
        value: monthlyValue,
        total: totalMonthly,
        percentage: data.propertyValue > 0 ? (totalMonthly / data.propertyValue) * 100 : 0,
        untilDelivery: monthlyUntilDelivery,
        afterDelivery: monthlyAfterDelivery,
      };
    }

    // Adicionar reforços semestrais
    if (data.semiannualReinforcement?.enabled && data.semiannualReinforcement.count) {
      result.semiannualReinforcement = {
        count: data.semiannualReinforcement.count,
        value: semiannualValue,
        total: totalSemiannual,
        percentage: data.propertyValue > 0 ? (totalSemiannual / data.propertyValue) * 100 : 0,
        untilDelivery: semiannualUntilDelivery,
        afterDelivery: semiannualAfterDelivery,
      };
    }

    // Adicionar reforços anuais
    if (data.annualReinforcement?.enabled && data.annualReinforcement.count) {
      result.annualReinforcement = {
        count: data.annualReinforcement.count,
        value: annualValue,
        total: totalAnnual,
        percentage: data.propertyValue > 0 ? (totalAnnual / data.propertyValue) * 100 : 0,
        untilDelivery: annualUntilDelivery,
        afterDelivery: annualAfterDelivery,
      };
    }

    // Adicionar início da obra
    if (constructionStartValue > 0) {
      result.constructionStartPayment = {
        value: constructionStartValue,
        percentage: data.propertyValue > 0 ? (constructionStartValue / data.propertyValue) * 100 : 0,
      };
    }

    // Adicionar chaves
    if (keysValue > 0) {
      result.keysPayment = {
        value: keysValue,
        percentage: data.propertyValue > 0 ? (keysValue / data.propertyValue) * 100 : 0,
      };
    }

    // 10. Validações
    if (data.propertyValue > 0) {
      const diff = Math.abs(totalPercentage - 100);
      if (diff > 1) {
        result.warnings.push(
          `Total: ${totalPercentage.toFixed(1)}% (${diff > 0 ? 'acima' : 'abaixo'} de 100%)`
        );
      }

      if (percentageUntilDelivery < 50) {
        result.warnings.push(
          `⚠️ Apenas ${percentageUntilDelivery.toFixed(1)}% até entrega (recomendado: mínimo 50%)`
        );
      }

      if (monthlyValue > data.propertyValue * 0.02) {
        result.warnings.push(
          `💡 Parcelas mensais acima de 2% do valor total - cliente pode ter dificuldade`
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
