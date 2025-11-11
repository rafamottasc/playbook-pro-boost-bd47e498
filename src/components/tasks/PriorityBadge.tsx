import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: 'urgente' | 'importante' | 'normal' | 'baixa';
  size?: 'default' | 'sm';
}

const priorityConfig = {
  urgente: {
    label: 'Urgente',
    className: 'bg-red-500 dark:bg-red-600 text-white border-0',
  },
  importante: {
    label: 'Importante',
    className: 'bg-yellow-500 dark:bg-yellow-600 text-white border-0',
  },
  normal: {
    label: 'Normal',
    className: 'bg-blue-500 dark:bg-blue-600 text-white border-0',
  },
  baixa: {
    label: 'Baixa',
    className: 'bg-gray-400 dark:bg-gray-600 text-white border-0',
  },
};

export function PriorityBadge({ priority, size = 'default' }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.className,
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-0.5',
        'font-medium rounded'
      )}
    >
      {config.label}
    </Badge>
  );
}
