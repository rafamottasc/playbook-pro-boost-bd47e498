import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

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

    // Log error for monitoring
    logger.error("Application error", {
      action: context.action,
      message: errorMessage,
      code: errorCode,
      metadata: context.details,
    });

    // Determine user-friendly message
    let userMessage = "Ocorreu um erro inesperado. Tente novamente.";
    let title = "Erro";

    // Network errors
    if (errorMessage.includes("Failed to fetch") || errorMessage.includes("Network")) {
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
