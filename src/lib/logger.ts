import { supabase } from "@/integrations/supabase/client";

/**
 * Sistema de Logging Profissional
 * 
 * Uso:
 * - logger.info("Mensagem", { action: "nome_acao", metadata: {...} })
 * - logger.warn("Alerta", { action: "nome_acao", metadata: {...} })
 * - logger.error("Erro", { action: "nome_acao", metadata: {...} })
 * 
 * Em desenvolvimento: logs aparecem no console
 * Em produção: logs são salvos no Supabase (tabela application_logs)
 */

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  /**
   * Método interno para processar logs
   */
  private async log(level: LogLevel, message: string, context?: LogContext): Promise<void> {
    const timestamp = new Date().toISOString();
    const url = typeof window !== 'undefined' ? window.location.href : '';

    // Em desenvolvimento: console
    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${level.toUpperCase()}]`, message, context || '');
    }

    // Em produção E desenvolvimento: salvar no Supabase (de forma resiliente)
    try {
      // Verificar se há sessão válida antes de tentar inserir
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        // Sem sessão válida, apenas log no console em desenvolvimento
        if (this.isDevelopment) {
          console.warn('Logger: No session, skipping database log');
        }
        return;
      }
      
      const { error } = await supabase.from('application_logs').insert({
        level,
        message,
        user_id: context?.userId || session.user.id,
        action: context?.action || null,
        metadata: context?.metadata || null,
        url,
        timestamp,
      });

      if (error && this.isDevelopment) {
        console.error('Failed to save log to Supabase:', error);
      }
    } catch (err) {
      // Falha COMPLETAMENTE silenciosa - nunca propagar erros do logger
      if (this.isDevelopment) {
        console.error('Logger error:', err);
      }
    }
  }

  /**
   * Log informativo - eventos normais do sistema
   * Exemplos: "User logged in", "Campaign created", "Report generated"
   */
  info(message: string, context?: LogContext): Promise<void> {
    return this.log('info', message, context);
  }

  /**
   * Log de alerta - situações que requerem atenção mas não são erros
   * Exemplos: "Slow query detected", "High memory usage", "Deprecated API used"
   */
  warn(message: string, context?: LogContext): Promise<void> {
    return this.log('warn', message, context);
  }

  /**
   * Log de erro - falhas e exceções
   * Exemplos: "Failed to delete user", "API request failed", "Database connection lost"
   */
  error(message: string, context?: LogContext): Promise<void> {
    return this.log('error', message, context);
  }

  /**
   * Helper para logar erros com stack trace
   */
  errorWithException(message: string, error: Error, context?: LogContext): Promise<void> {
    return this.log('error', message, {
      ...context,
      metadata: {
        ...context?.metadata,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      },
    });
  }

  /**
   * Helper para logar ações de usuário
   */
  userAction(action: string, userId: string, metadata?: Record<string, any>): Promise<void> {
    return this.log('info', `User action: ${action}`, {
      userId,
      action,
      metadata,
    });
  }

  /**
   * Helper para logar operações de banco de dados
   */
  dbOperation(operation: string, table: string, success: boolean, metadata?: Record<string, any>): Promise<void> {
    const level: LogLevel = success ? 'info' : 'error';
    return this.log(level, `DB ${operation} on ${table}: ${success ? 'success' : 'failed'}`, {
      action: `db_${operation}`,
      metadata: { table, success, ...metadata },
    });
  }

  /**
   * Helper para logar performance
   */
  performance(operation: string, durationMs: number, metadata?: Record<string, any>): Promise<void> {
    const level: LogLevel = durationMs > 3000 ? 'warn' : 'info';
    return this.log(level, `Performance: ${operation} took ${durationMs}ms`, {
      action: 'performance',
      metadata: { operation, durationMs, ...metadata },
    });
  }
}

/**
 * Instância única do logger para uso em toda a aplicação
 */
export const logger = new Logger();

/**
 * Helper para medir performance de funções
 * 
 * Uso:
 * const result = await measurePerformance('loadCampaigns', async () => {
 *   return await fetchCampaigns();
 * });
 */
export async function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    await logger.performance(operation, duration, context?.metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    await logger.performance(`${operation} (failed)`, duration, context?.metadata);
    throw error;
  }
}
