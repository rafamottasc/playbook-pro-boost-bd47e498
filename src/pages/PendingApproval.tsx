import { Card } from "@/components/ui/card";
import { AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PendingApproval() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <Card className="max-w-md w-full p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-yellow-500/10 p-4">
            <Clock className="h-12 w-12 text-yellow-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Cadastro Pendente de Aprovação</h1>
          <p className="text-muted-foreground">
            Seu cadastro foi concluído com sucesso! 
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground text-left">
              No momento, seu acesso está <strong>pendente de aprovação</strong> por um administrador. 
              Você receberá uma notificação assim que seu cadastro for aprovado e poderá acessar 
              todas as funcionalidades da plataforma.
            </p>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Aguarde a aprovação ou entre em contato com o administrador se precisar de ajuda.
          </p>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="w-full"
          >
            Sair
          </Button>
        </div>
      </Card>
    </div>
  );
}
