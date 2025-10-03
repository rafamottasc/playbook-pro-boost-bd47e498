export const COUNTRIES = [
  { code: "BR", name: "🇧🇷 Brasil", flag: "🇧🇷" },
  { code: "US", name: "🇺🇸 Estados Unidos", flag: "🇺🇸" },
  { code: "PT", name: "🇵🇹 Portugal", flag: "🇵🇹" },
  { code: "AR", name: "🇦🇷 Argentina", flag: "🇦🇷" },
  { code: "UY", name: "🇺🇾 Uruguai", flag: "🇺🇾" },
  { code: "ES", name: "🇪🇸 Espanha", flag: "🇪🇸" },
  { code: "IT", name: "🇮🇹 Itália", flag: "🇮🇹" },
  { code: "FR", name: "🇫🇷 França", flag: "🇫🇷" },
  { code: "UK", name: "🇬🇧 Reino Unido", flag: "🇬🇧" },
  { code: "CA", name: "🇨🇦 Canadá", flag: "🇨🇦" },
];

export const BRAZILIAN_STATES = [
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AP", name: "Amapá" },
  { code: "AM", name: "Amazonas" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceará" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espírito Santo" },
  { code: "GO", name: "Goiás" },
  { code: "MA", name: "Maranhão" },
  { code: "MT", name: "Mato Grosso" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MG", name: "Minas Gerais" },
  { code: "PA", name: "Pará" },
  { code: "PB", name: "Paraíba" },
  { code: "PR", name: "Paraná" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piauí" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "RO", name: "Rondônia" },
  { code: "RR", name: "Roraima" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SP", name: "São Paulo" },
  { code: "SE", name: "Sergipe" },
  { code: "TO", name: "Tocantins" },
];

export const getCountryFlag = (code: string) => {
  return COUNTRIES.find(c => c.code === code)?.flag || "🌍";
};

export const getCountryName = (code: string) => {
  return COUNTRIES.find(c => c.code === code)?.name || code;
};

export const getStateName = (code: string) => {
  return BRAZILIAN_STATES.find(s => s.code === code)?.name || code;
};
