import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formata telefone brasileiro (xx) xxxxx-xxxx ou (xx) xxxx-xxxx
export function formatPhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  
  if (digits.length === 11) {
    // Celular: (XX) 9XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  
  return phone; // Retorna original se não tiver formato esperado
}

// Remove formatação para salvar no banco
export function unformatPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

// Formata valores monetários no padrão brasileiro
export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Formata valores monetários com SEMPRE 2 casas decimais para exibição
export function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Arredonda valores monetários para 2 casas decimais
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

// Divide valor em parcelas, garantindo que a soma fecha exato
export function divideIntoInstallments(total: number, count: number): number[] {
  if (count <= 0) return [];
  
  const baseValue = Math.floor((total * 100) / count) / 100;
  const installments = new Array(count).fill(baseValue);
  
  // Calcula diferença e adiciona na última parcela
  const sum = baseValue * count;
  const difference = roundMoney(total - sum);
  installments[count - 1] = roundMoney(baseValue + difference);
  
  return installments;
}

// Formata input de moeda considerando centavos
export function parseCurrencyInput(value: string): number {
  const numbers = value.replace(/\D/g, "");
  // Os últimos 2 dígitos são centavos
  const amount = parseInt(numbers || "0") / 100;
  return amount;
}

// Formata para exibição no input
export function formatCurrencyInput(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Retorna a cor da badge de prazo baseada na proximidade da data
export function getDeadlineBadgeColor(taskDate: string, status: string): {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Força timezone local adicionando hora para evitar conversão UTC
  const deadline = new Date(taskDate + 'T00:00:00');
  deadline.setHours(0, 0, 0, 0);
  
  const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Tarefa concluída: verde
  if (status === 'done') {
    return {
      variant: 'default',
      className: 'bg-green-500 hover:bg-green-600 text-white'
    };
  }

  // Atrasada: vermelho
  if (daysUntilDeadline < 0) {
    return {
      variant: 'destructive',
      className: 'bg-red-500 hover:bg-red-600 text-white'
    };
  }

  // Próximo (hoje ou amanhã): amarelo
  if (daysUntilDeadline <= 1) {
    return {
      variant: 'default',
      className: 'bg-yellow-500 hover:bg-yellow-600 text-white'
    };
  }

  // Em breve (2-3 dias): laranja
  if (daysUntilDeadline <= 3) {
    return {
      variant: 'default',
      className: 'bg-orange-500 hover:bg-orange-600 text-white'
    };
  }

  // Prazo distante: cinza
  return {
    variant: 'outline',
    className: 'border-muted-foreground/30 text-muted-foreground'
  };
}
