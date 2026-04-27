import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { translateAuthError } from "@/lib/validations";

interface ErrorContext {
  action?: string;
  details?: Record<string, any>;
}

export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = (
    error: any,
    context: ErrorContext = {}
  ) => {
    const errorMessage = error?.message || "Erro desconhecido";
    const errorCode = error?.code || error?.status;
    const errorCodeStr = String(errorCode || "").toLowerCase();
    const lowerMsg = errorMessage.toLowerCase();

    // Log error for monitoring
    logger.error("Application error", {
      action: context.action,
      metadata: {
        message: errorMessage,
        code: errorCode,
        ...context.details,
      }
    });

    // Determine user-friendly message
    let userMessage = "Ocorreu um erro inesperado. Tente novamente.";
    let title = "Erro";

    // ---- Supabase Auth specific errors (must come BEFORE generic handlers) ----
    // Senha vazada (HIBP)
    if (
      errorCodeStr === "weak_password" ||
      lowerMsg.includes("known to be weak") ||
      lowerMsg.includes("pwned") ||
      (error?.weak_password)
    ) {
      title = "Senha insegura";
      userMessage =
        "Esta senha foi encontrada em vazamentos públicos. Escolha uma senha única que você não usa em outros sites.";
    }
    // E-mail já cadastrado
    else if (
      errorCodeStr === "user_already_exists" ||
      lowerMsg.includes("already registered") ||
      lowerMsg.includes("already exists")
    ) {
      title = "E-mail já cadastrado";
      userMessage =
        "Este e-mail já possui uma conta. Faça login ou use 'Esqueci minha senha'.";
    }
    // Limite de envio de e-mails do Auth
    else if (
      errorCodeStr === "over_email_send_rate_limit" ||
      lowerMsg.includes("email rate limit")
    ) {
      title = "Aguarde alguns minutos";
      userMessage =
        "Muitos e-mails foram enviados recentemente. Aguarde alguns minutos e tente novamente.";
    }
    // Network errors
    else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("Network")) {
      title = "Erro de Conexão";
      userMessage = "Verifique sua conexão com a internet e tente novamente.";
    }
    // Database errors
    else if (errorCode === "PGRST116") {
      title = "Dados não encontrados";
      userMessage = "Os dados solicitados não foram encontrados.";
    }
    // Permission errors
    else if (errorCode === 403 || errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      title = "Acesso Negado";
      userMessage = "Você não tem permissão para realizar esta ação.";
    }
    // Validation errors
    else if (errorCode === 400 || errorMessage.includes("validation")) {
      title = "Dados Inválidos";
      userMessage = "Verifique os dados informados e tente novamente.";
    }
    // Auth errors
    else if (errorCode === 401 || errorMessage.includes("authentication")) {
      title = "Sessão Expirada";
      userMessage = "Sua sessão expirou. Faça login novamente.";
    }
    // Rate limit
    else if (errorCode === 429) {
      title = "Muitas Tentativas";
      userMessage = "Você fez muitas tentativas. Aguarde alguns minutos e tente novamente.";
    }
    // Custom message from error
    else if (error?.userMessage) {
      userMessage = error.userMessage;
    }
    // Fallback: tentar traduzir mensagem conhecida do Supabase Auth
    else {
      const translated = translateAuthError(errorMessage);
      if (translated && translated !== errorMessage && translated !== "Erro desconhecido") {
        userMessage = translated;
      }
    }

    // Show toast to user
    toast({
      title,
      description: userMessage,
      variant: "destructive",
    });

    return {
      handled: true,
      message: userMessage,
      code: errorCode,
    };
  };

  const handleSuccess = (message: string, title: string = "Sucesso") => {
    toast({
      title,
      description: message,
    });

    logger.info("Operation successful", {
      action: message,
    });
  };

  return {
    handleError,
    handleSuccess,
  };
}
