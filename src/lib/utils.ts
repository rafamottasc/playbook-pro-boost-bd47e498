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
