import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface FeedbackCardProps {
  onClick: () => void;
}

export function FeedbackCard({ onClick }: FeedbackCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in border-2 hover:border-primary/50"
      onClick={onClick}
    >
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4 text-primary">
          <MessageSquare className="w-12 h-12" />
        </div>
        <CardTitle className="text-xl">Sugestões & Feedbacks</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <CardDescription className="text-base">
          Compartilhe suas ideias e feedbacks de forma 100% anônima
        </CardDescription>
      </CardContent>
    </Card>
  );
}
