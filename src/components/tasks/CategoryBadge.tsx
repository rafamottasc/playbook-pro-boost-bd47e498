import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DynamicIcon } from "@/components/admin/DynamicIcon";
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
        "border flex items-center gap-1",
        size === 'sm' && 'text-xs px-2 py-0'
      )}
    >
      <DynamicIcon name={category.icon} className={cn("w-3 h-3", size === 'sm' && 'w-3 h-3')} />
      {category.label}
    </Badge>
  );
}
