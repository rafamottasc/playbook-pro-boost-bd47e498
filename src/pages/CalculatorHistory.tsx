import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SavedProposalCard } from "@/components/calculator/SavedProposalCard";
import { generateFlowPDF } from "@/components/calculator/FlowPDF";
import { usePaymentFlow, PaymentFlowData } from "@/hooks/usePaymentFlow";
import { PageTransition } from "@/components/PageTransition";

interface SavedProposal {
  id: string;
  client_name: string;
  calculation_data: any;
  created_at: string;
}

export default function CalculatorHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { setData, calculate } = usePaymentFlow();
  const [proposals, setProposals] = useState<SavedProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_flows")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProposals(data || []);
    } catch (error) {
      console.error("Erro ao carregar propostas:", error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadProposal = (proposal: SavedProposal) => {
    setData(proposal.calculation_data);
    navigate("/calculator");
    toast({
      title: "Proposta carregada",
      description: "Você pode editar e salvar novamente",
    });
  };

  const handleDeleteProposal = async (id: string) => {
    try {
      const { error } = await supabase
        .from("payment_flows")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setProposals((prev) => prev.filter((p) => p.id !== id));

      toast({
        title: "Proposta deletada",
        description: "Removida com sucesso",
      });
    } catch (error) {
      console.error("Erro ao deletar proposta:", error);
      toast({
        title: "Erro ao deletar",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleDownloadProposal = async (proposal: SavedProposal) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user?.id)
        .single();

      setData(proposal.calculation_data);
      const result = calculate();

      await generateFlowPDF(
        proposal.calculation_data,
        result,
        profile?.full_name || "Corretor"
      );

      toast({
        title: "PDF gerado com sucesso!",
        description: "O arquivo foi baixado",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="bg-card border-b sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/calculator")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Histórico de Propostas</h1>
                  <p className="text-sm text-muted-foreground">
                    {proposals.length} proposta(s) salva(s)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhuma proposta salva ainda
              </p>
              <Button onClick={() => navigate("/calculator")}>
                Criar primeira proposta
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proposals.map((proposal) => (
                <SavedProposalCard
                  key={proposal.id}
                  id={proposal.id}
                  clientName={proposal.client_name}
                  calculationData={proposal.calculation_data}
                  createdAt={proposal.created_at}
                  onLoad={() => handleLoadProposal(proposal)}
                  onDelete={() => handleDeleteProposal(proposal.id)}
                  onDownload={() => handleDownloadProposal(proposal)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
