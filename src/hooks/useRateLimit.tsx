import { supabase } from "@/integrations/supabase/client";

interface RateLimitResult {
  allowed: boolean;
  message?: string;
}

/**
 * Hook para verificação de rate limiting
 * Encapsula a lógica de chamada à Edge Function 'rate-limit'
 * 
 * Limites:
 * - Login: 5 tentativas em 15 minutos
 * - Signup: 3 tentativas em 15 minutos
 * 
 * Estratégia: Fail-open (permite acesso em caso de erro na verificação)
 */
export const useRateLimit = () => {
  const checkRateLimit = async (
    identifier: string,
    action: 'login' | 'signup'
  ): Promise<RateLimitResult> => {
    try {
      const response = await supabase.functions.invoke('rate-limit', {
        body: { identifier, action }
      });

      // Se houver erro na Edge Function, permite acesso (fail-open)
      if (response.error) {
        console.error('Rate limit check failed:', response.error);
        return { 
          allowed: true  // Fail-open para não bloquear usuários em caso de erro
        };
      }

      // Se a resposta indica que não é permitido
      if (!response.data?.allowed) {
        return {
          allowed: false,
          message: response.data?.message || "Muitas tentativas. Aguarde alguns minutos."
        };
      }

      // Acesso permitido
      return { allowed: true };
      
    } catch (error) {
      console.error('Unexpected error in rate limit check:', error);
      // Em caso de erro inesperado, permite acesso (fail-open)
      return { allowed: true };
    }
  };

  return { checkRateLimit };
};
