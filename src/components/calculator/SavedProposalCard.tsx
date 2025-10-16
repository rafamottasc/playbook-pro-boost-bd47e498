import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { PaymentFlowData } from "@/hooks/usePaymentFlow";

interface SavedProposalCardProps {
  id: string;
  clientName: string;
  calculationData: any;
  createdAt: string;
  onLoad: () => void;
  onDelete: () => void;
  onDownload: () => void;
}

export function SavedProposalCard({
  clientName,
  calculationData,
  createdAt,
  onLoad,
  onDelete,
  onDownload,
}: SavedProposalCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          👤 {clientName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Valor Total:</span>
          <span className="font-medium">
            R$ {calculationData.propertyValue.toLocaleString("pt-BR")}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Criado em:</span>
          <span className="font-medium">
            {format(new Date(createdAt), "dd/MM/yyyy 'às' HH:mm")}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={onLoad} variant="default" className="flex-1" size="sm">
          <Eye className="mr-2 h-4 w-4" />
          Carregar
        </Button>
        <Button onClick={onDownload} variant="outline" size="sm">
          <Download className="h-4 w-4" />
        </Button>
        <Button onClick={onDelete} variant="destructive" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
