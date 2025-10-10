export const FUNNELS = [
  { id: "lead-novo", name: "Abordagem – Lead Novo" },
  { id: "atendimento", name: "Atendimento Geral" },
  { id: "repescagem", name: "Repescagem" },
  { id: "nutricao", name: "Nutrição" },
] as const;

export const STAGES_BY_FUNNEL: Record<string, string[]> = {
  "lead-novo": [
    "1ª Abordagem",
    "2ª Abordagem",
    "3ª Abordagem",
    "4ª Abordagem",
    "5ª Abordagem",
    "6ª Abordagem",
    "7ª Abordagem",
  ],
  atendimento: [
    "Sondagem",
    "Apresentação do Produto",
    "Visita / Call",
    "Proposta",
    "Fechamento",
  ],
  repescagem: [
    "Reativação",
  ],
  nutricao: [
    "Educação",
    "Oportunidades",
  ],
};

// Para compatibilidade com o Playbooks.tsx
export const STAGES = STAGES_BY_FUNNEL;
