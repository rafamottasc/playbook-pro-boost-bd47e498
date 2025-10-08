import { z } from "zod";

// Authentication validation schemas
export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres"),
  password: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres"),
});

export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres"),
  password: z
    .string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
  fullName: z
    .string()
    .trim()
    .min(1, "Nome completo é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  whatsapp: z
    .string()
    .trim()
    .min(1, "WhatsApp é obrigatório")
    .regex(/^\d{10,15}$/, "WhatsApp deve conter entre 10 e 15 dígitos (apenas números)"),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres"),
});

// Profile validation schemas
export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Nome completo é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  whatsapp: z
    .string()
    .trim()
    .min(1, "WhatsApp é obrigatório")
    .regex(/^\d{10,15}$/, "WhatsApp deve conter entre 10 e 15 dígitos (apenas números)"),
});

// Message validation schemas
export const messageSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Título é obrigatório")
    .max(200, "Título deve ter no máximo 200 caracteres"),
  content: z
    .string()
    .trim()
    .min(1, "Conteúdo é obrigatório")
    .max(2000, "Conteúdo deve ter no máximo 2000 caracteres"),
  funnel: z.string().min(1, "Funil é obrigatório"),
  stage: z.string().min(1, "Etapa é obrigatória"),
});

// Resource validation schemas
export const resourceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Título é obrigatório")
    .max(200, "Título deve ter no máximo 200 caracteres"),
  description: z
    .string()
    .trim()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional(),
  url: z
    .string()
    .trim()
    .min(1, "URL é obrigatória")
    .url("URL inválida")
    .max(500, "URL deve ter no máximo 500 caracteres"),
  resourceType: z.string().min(1, "Tipo de recurso é obrigatório"),
});

// Suggestion validation schema
export const suggestionSchema = z.object({
  suggestionText: z
    .string()
    .trim()
    .min(1, "Texto da sugestão é obrigatório")
    .max(1000, "Sugestão deve ter no máximo 1000 caracteres"),
});

// Type exports for TypeScript
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ResourceInput = z.infer<typeof resourceSchema>;
export type SuggestionInput = z.infer<typeof suggestionSchema>;
