import { useState, useEffect, useMemo } from "react";
import { differenceInMonths, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export interface Currency {
  code: 'BRL' | 'USD' | 'EUR' | 'GBP';
  symbol: string;
  rate: number;
  name: string;
}

export interface PaymentFlowData {
  propertyValue: number;
  constructionStartDate: string;
  deliveryDate: string;
  clientName: string;
  currency?: Currency;
  downPayment: {
    type: 'percentage' | 'value';
    percentage?: number;
    value?: number;
    installments?: number;
    firstDueDate?: string;
    ato?: {
      type: 'percentage' | 'value';
      percentage?: number;
      value?: number;
      firstDueDate?: string;
    };
  };
  constructionStartPayment?: {
    type: 'percentage' | 'value';
    percentage?: number;
    value?: number;
    firstDueDate?: string;
  };
  monthly?: { 
    enabled: boolean; 
    count?: number; 
    value?: number;
    percentage?: number;
    type?: 'percentage' | 'value';
    autoCalculate?: boolean;
    firstDueDate?: string;
  };
  semiannualReinforcement?: { 
    enabled: boolean; 
    count?: number; 
    value?: number;
    percentage?: number;
    type?: 'percentage' | 'value';
    autoCalculate?: boolean;
    firstDueDate?: string;
  };
  annualReinforcement?: { 
    enabled: boolean; 
    count?: number; 
    value?: number;
    percentage?: number;
    type?: 'percentage' | 'value';
    autoCalculate?: boolean;
    firstDueDate?: string;
  };
  keysPayment?: {
    type: 'percentage' | 'value';
    percentage?: number;
    value?: number;
    isSaldoMode?: boolean;
    firstDueDate?: string;
  };
  constructora?: string;
  empreendimento?: string;
  unidade?: string;
  areaPrivativa?: string;
  descritivoImovel?: string;
}

export interface CalculatedResult {
  downPayment: { 
    value: number; 
    percentage: number;
    installments?: number;
    installmentValue?: number;
    atoValue?: number;
    atoPercentage?: number;
    downPaymentParceladoValue?: number;
    downPaymentParceladoPercentage?: number;
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
  pricePerSqm?: number;
  totalInCub?: number;
  cubValue?: number;
  cubWarning?: string;
  isValid: boolean;
  warnings: string[];
  // Novas propriedades para validação de limite
  exceedsLimit: boolean;
  exceededAmount: number;
  availableAmount: number;
}

export function usePaymentFlow() {
  const [data, setData] = useState<PaymentFlowData>({
    propertyValue: 0,
    constructionStartDate: "",
    deliveryDate: "",
    clientName: "",
    currency: {
      code: 'BRL',
      symbol: 'R$',
      rate: 1,
      name: 'Real Brasileiro'
    },
    downPayment: { type: 'percentage', percentage: 0, value: 0 },
    monthly: { enabled: false, autoCalculate: false },
    semiannualReinforcement: { enabled: false },
    annualReinforcement: { enabled: false },
    keysPayment: { type: 'percentage', percentage: 0, value: 0 },
  });

  const [cubValue, setCubValue] = useState<number | null>(null);
  const [cubWarning, setCubWarning] = useState<string | null>(null);

  useEffect(() => {
    const fetchCub = async () => {
      const now = new Date();
      const { data: cubData } = await supabase
        .from("cub_values")
        .select("value, month, year")
        .eq("month", now.getMonth() + 1)
        .eq("year", now.getFullYear())
        .maybeSingle();

      if (cubData) {
        setCubValue(cubData.value);
        setCubWarning(null);
      } else {
        const { data: latest } = await supabase
          .from("cub_values")
          .select("value, month, year")
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latest) {
          setCubValue(latest.value);
          setCubWarning(`⚠️ Usando CUB de ${latest.month}/${latest.year}`);
        }
      }
    };

    fetchCub();
  }, []);

  // Memoizar função de cálculo para evitar recálculos desnecessários
  const calculate = useMemo(() => {
    return (): CalculatedResult => {
      // Helper: Buscar data do primeiro pagamento
      const getFirstPaymentDate = (): Date | null => {
        const dates: Date[] = [];
        
        if (data.downPayment.ato?.firstDueDate) {
          try { dates.push(parseISO(data.downPayment.ato.firstDueDate)); } catch {}
        }
        if (data.downPayment.firstDueDate) {
          try { dates.push(parseISO(data.downPayment.firstDueDate)); } catch {}
        }
        if (data.constructionStartPayment?.firstDueDate) {
          try { dates.push(parseISO(data.constructionStartPayment.firstDueDate)); } catch {}
        }
        if (data.monthly?.firstDueDate) {
          try { dates.push(parseISO(data.monthly.firstDueDate)); } catch {}
        }
        
        if (dates.length > 0) {
          return new Date(Math.min(...dates.map(d => d.getTime())));
        }
        
        return null;
      };

      // 1. Calcular meses até entrega (do primeiro pagamento até a entrega)
      let monthsUntilDelivery = 0;
      const firstPaymentDate = getFirstPaymentDate();

      if (firstPaymentDate && data.deliveryDate) {
        try {
          const end = parseISO(data.deliveryDate);
          monthsUntilDelivery = Math.max(0, differenceInMonths(end, firstPaymentDate));
        } catch (e) {
          monthsUntilDelivery = 0;
        }
      }

      // 2. Calcular entrada (com Ato)
      let atoValue = 0;
      if (data.downPayment.ato) {
        if (data.downPayment.ato.type === 'percentage' && data.downPayment.ato.percentage) {
          atoValue = (data.downPayment.ato.percentage / 100) * data.propertyValue;
        } else if (data.downPayment.ato.type === 'value' && data.downPayment.ato.value) {
          atoValue = data.downPayment.ato.value;
        }
      }

      let downPaymentParceladoValue = 0;
      if (data.downPayment.type === 'percentage' && data.downPayment.percentage) {
        downPaymentParceladoValue = (data.downPayment.percentage / 100) * data.propertyValue;
      } else if (data.downPayment.type === 'value' && data.downPayment.value) {
        downPaymentParceladoValue = data.downPayment.value;
      }

      const downPaymentValue = atoValue + downPaymentParceladoValue;

      const downPaymentInstallmentValue = data.downPayment.installments && data.downPayment.installments > 1
        ? downPaymentParceladoValue / data.downPayment.installments
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
        // Só calcula se valor OU porcentagem foram explicitamente definidos (> 0)
        if (data.semiannualReinforcement.value && data.semiannualReinforcement.value > 0) {
          semiannualValue = data.semiannualReinforcement.value;
        } else if (data.semiannualReinforcement.percentage && data.semiannualReinforcement.percentage > 0) {
          semiannualValue = (data.semiannualReinforcement.percentage / 100) * data.propertyValue;
        }
        totalSemiannual = semiannualValue * data.semiannualReinforcement.count;
      }

      let totalAnnual = 0;
      let annualValue = 0;
      if (data.annualReinforcement?.enabled && data.annualReinforcement.count) {
        // Só calcula se valor OU porcentagem foram explicitamente definidos (> 0)
        if (data.annualReinforcement.value && data.annualReinforcement.value > 0) {
          annualValue = data.annualReinforcement.value;
        } else if (data.annualReinforcement.percentage && data.annualReinforcement.percentage > 0) {
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
          // Modo automático: calcular saldo restante
          const remainingBalance = data.propertyValue - downPaymentValue - constructionStartValue - totalSemiannual - totalAnnual - keysValue;
          monthlyValue = remainingBalance / data.monthly.count;
          totalMonthly = monthlyValue * data.monthly.count;
        } else if (data.monthly.value) {
          // Modo manual: usar valor definido pelo usuário
          monthlyValue = data.monthly.value;
          totalMonthly = monthlyValue * data.monthly.count;
        } else if (data.monthly.percentage) {
          // Fallback: usar percentual se não tiver valor
          monthlyValue = (data.monthly.percentage / 100) * data.propertyValue / data.monthly.count;
          totalMonthly = monthlyValue * data.monthly.count;
        }
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

      // Calcular se excede o limite de 100%
      const exceedsLimit = totalPercentage > 100.5; // Tolerância de 0.5% para arredondamentos
      const exceededAmount = exceedsLimit ? totalPaid - data.propertyValue : 0;
      const availableAmount = Math.max(0, data.propertyValue - totalPaid);

      // 9. Montar resultado
      const result: CalculatedResult = {
        downPayment: {
          value: downPaymentValue,
          percentage: data.propertyValue > 0 ? (downPaymentValue / data.propertyValue) * 100 : 0,
          installments: data.downPayment.installments || 1,
          installmentValue: downPaymentInstallmentValue,
          atoValue: atoValue > 0 ? atoValue : undefined,
          atoPercentage: atoValue > 0 && data.propertyValue > 0 ? (atoValue / data.propertyValue) * 100 : undefined,
          downPaymentParceladoValue: downPaymentParceladoValue > 0 ? downPaymentParceladoValue : undefined,
          downPaymentParceladoPercentage: downPaymentParceladoValue > 0 && data.propertyValue > 0 ? (downPaymentParceladoValue / data.propertyValue) * 100 : undefined,
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
        exceedsLimit,
        exceededAmount,
        availableAmount,
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

      // 11. Calcular valor por m²
      if (data.areaPrivativa && parseFloat(data.areaPrivativa) > 0) {
        result.pricePerSqm = data.propertyValue / parseFloat(data.areaPrivativa);
      }

      // 12. Calcular CUB
      if (cubValue) {
        result.cubValue = cubValue;
        result.totalInCub = data.propertyValue / cubValue;
        if (cubWarning) {
          result.cubWarning = cubWarning;
        }
      }

      return result;
    };
  }, [data, cubValue, cubWarning]);

  const updateField = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  return { data, setData, updateField, calculate };
}
