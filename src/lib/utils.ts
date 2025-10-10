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
