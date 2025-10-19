import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface FeedbackCardProps {
  onClick: () => void;
}

export function FeedbackCard({ onClick }: FeedbackCardProps) {
  return (
    <Card
      className="cursor-pointer animate-fade-in transition-all duration-300 border border-border/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:translate-y-[-2px]"
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
