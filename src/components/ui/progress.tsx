import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    variant?: 'default' | 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  }
>(({ className, value, variant = 'default', ...props }, ref) => {
  const variantColors = {
    default: 'hsl(var(--primary))',
    great: 'hsl(142.1 76% 45%)',      // Verde (igual badge)
    good: 'hsl(221.2 83% 53%)',       // Azul (igual badge)
    okay: 'hsl(47.9 96% 53%)',        // Amarelo (igual badge)
    bad: 'hsl(24.6 95% 53%)',         // Laranja (igual badge)
    terrible: 'hsl(0 84% 60%)',       // Vermelho (igual badge)
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative w-full overflow-hidden rounded-full", className)}
      style={{ backgroundColor: 'hsl(240 5% 96%)' }}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 transition-all duration-500 ease-out"
        style={{ 
          transform: `translateX(-${100 - (value || 0)}%)`,
          backgroundColor: variantColors[variant]
        }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
