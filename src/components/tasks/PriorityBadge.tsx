import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: 'urgente' | 'importante' | 'normal' | 'baixa';
  size?: 'default' | 'sm';
}

const priorityConfig = {
  urgente: {
    label: 'Urgente',
    icon: '🔴',
    className: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800',
  },
  importante: {
    label: 'Importante',
    icon: '🟡',
    className: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800',
  },
  normal: {
    label: 'Normal',
    icon: '🔵',
    className: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800',
  },
  baixa: {
    label: 'Baixa',
    icon: '⚪',
    className: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700',
  },
};

export function PriorityBadge({ priority, size = 'default' }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.className,
        size === 'sm' && 'text-xs px-2 py-0'
      )}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
}
