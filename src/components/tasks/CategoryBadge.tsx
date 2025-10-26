import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskCategory } from "@/hooks/useTasks";

interface CategoryBadgeProps {
  category: TaskCategory;
  size?: 'default' | 'sm';
}

export function CategoryBadge({ category, size = 'default' }: CategoryBadgeProps) {
  return (
    <Badge 
      variant="outline"
      className={cn(
        category.color,
        "border",
        size === 'sm' && 'text-xs px-2 py-0'
      )}
    >
      <span className="mr-1">{category.icon}</span>
      {category.label}
    </Badge>
  );
}
