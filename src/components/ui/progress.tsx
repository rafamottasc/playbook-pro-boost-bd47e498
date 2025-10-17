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
    great: 'hsl(142.1 70% 45%)',      // Verde mais vibrante
    good: 'hsl(221.2 83.2% 58%)',     // Azul mais claro
    okay: 'hsl(47.9 95.8% 55%)',      // Amarelo ajustado
    bad: 'hsl(24.6 95% 58%)',         // Laranja ajustado
    terrible: 'hsl(0 84.2% 65%)',     // Vermelho ajustado
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
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
