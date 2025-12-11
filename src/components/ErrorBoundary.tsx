import React, { Component, ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: Props) {
    // Se tinha erro e os children mudaram, reseta o estado
    if (this.state.hasError && this.props.children !== prevProps.children) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Logger resiliente - não deixar falhar
    try {
      logger.error("React Error Boundary caught error", {
        action: "error_boundary",
        metadata: {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        },
      });
    } catch {
      // Ignorar erros do logger
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Algo deu errado</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">
                Ocorreu um erro ao carregar esta página. Por favor, tente novamente.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: undefined });
                  }}
                  variant="default"
                >
                  Tentar novamente
                </Button>
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: undefined });
                    window.location.href = "/";
                  }}
                  variant="outline"
                >
                  Voltar para o início
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
