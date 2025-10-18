import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DynamicIcon } from "./DynamicIcon";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

const AVAILABLE_ICONS = [
  // Negócios & Análise
  "TrendingUp", "TrendingDown", "BarChart3", "LineChart", "PieChart", 
  "Activity", "Target", "Award", "TrendingUpDown",
  
  // Comunicação
  "Phone", "MessageSquare", "Mail", "Send", "Bell", 
  "Megaphone", "PhoneCall", "MessageCircle",
  
  // Status & Ação
  "Check", "X", "AlertTriangle", "HelpCircle", "AlertCircle", 
  "Lightbulb", "Flame", "Star", "Sparkles", "Rocket",
  
  // Pessoas & Negócios
  "User", "Users", "Handshake", "UserCheck", "UserPlus", 
  "Briefcase", "Brain", "Zap", "GraduationCap",
  
  // Finanças
  "DollarSign", "CreditCard", "Wallet", "Coins",
  
  // Outros
  "Circle", "Square", "Triangle", "Flag", "Bookmark", "Package",
  "Heart", "ThumbsUp", "Clock", "Calendar"
];

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="space-y-3">
      <div className="border rounded-lg p-4 bg-card">
        <ScrollArea className="h-48">
          <div className="grid grid-cols-8 gap-2">
            {AVAILABLE_ICONS.map((iconName) => (
              <Button
                key={iconName}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(iconName)}
                className={cn(
                  "h-10 w-10 p-0 hover:bg-primary/10 transition-all",
                  value === iconName && "border-2 border-primary bg-primary/10"
                )}
              >
                <DynamicIcon name={iconName} className="h-5 w-5 text-primary" />
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {value && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Selecionado:</span>
          <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded">
            <DynamicIcon name={value} className="h-4 w-4 text-primary" />
          </div>
        </div>
      )}
    </div>
  );
}
