import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Retorna o badge de status visual do usuário
 */
export const getStatusBadge = (approved: boolean, blocked: boolean) => {
  if (blocked) {
    return { variant: "destructive" as const, text: "Bloqueado" };
  }
  if (approved) {
    return { 
      variant: "default" as const, 
      text: "Ativo",
      className: "bg-green-600 hover:bg-green-700 text-white"
    };
  }
  return { 
    variant: "outline" as const, 
    text: "Pendente",
    className: "border-yellow-500 text-yellow-600"
  };
};

/**
 * Formata data para exibição (dd/MM/yyyy HH:mm)
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Nunca";
  try {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return "Data inválida";
  }
};

/**
 * Retorna status de atividade do usuário baseado no último login
 * 
 * - < 5 min: Online agora (🟢)
 * - < 60 min: Há X min (🟡)
 * - > 60 min: Tempo relativo (⚪)
 */
export const getLastActivityStatus = (lastSignIn: string | null) => {
  if (!lastSignIn) {
    return { 
      text: "Nunca", 
      status: "offline" as const, 
      color: "text-muted-foreground",
      badge: "⚪"
    };
  }

  const now = new Date();
  const lastActivity = new Date(lastSignIn);
  
  const diffMs = now.getTime() - lastActivity.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  // Online agora (< 5 min)
  if (diffMinutes < 5) {
    return {
      text: "Online agora",
      status: "online" as const,
      color: "text-green-600",
      badge: "🟢"
    };
  }

  // Recente (< 60 min)
  if (diffMinutes < 60) {
    return {
      text: `Há ${diffMinutes} min`,
      status: "recent" as const,
      color: "text-green-500",
      badge: "🟡"
    };
  }

  // Offline (tempo relativo)
  try {
    return {
      text: formatDistanceToNow(lastActivity, { 
        addSuffix: true, 
        locale: ptBR 
      }),
      status: "offline" as const,
      color: "text-muted-foreground",
      badge: "⚪"
    };
  } catch {
    return {
      text: "Data inválida",
      status: "offline" as const,
      color: "text-muted-foreground",
      badge: "⚪"
    };
  }
};
