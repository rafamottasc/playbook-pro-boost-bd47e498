/**
 * Modo de manutenção / bloqueio de login.
 * Quando MAINTENANCE_MODE = true:
 *  - Todas as tentativas de login (email/senha e Google) são bloqueadas
 *  - Cadastros novos são bloqueados
 *  - Sessões ativas são derrubadas automaticamente
 *
 * Para REATIVAR o login normal, basta mudar MAINTENANCE_MODE para false.
 */
export const MAINTENANCE_MODE = false;

export const MAINTENANCE_MESSAGE =
  "⚠️ Erro de conexão 503 - Falha ao comunicar com o servidor de autenticação (code: AUTH_DB_TIMEOUT). Aguarde alguns minutos e tente novamente.";

export const maintenanceError = () => ({
  error: {
    message: MAINTENANCE_MESSAGE,
    userMessage: MAINTENANCE_MESSAGE,
    code: 503,
  } as any,
});
