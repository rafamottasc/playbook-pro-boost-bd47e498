import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  // Cores fixas para moods (não sobrescritas pelo tema)
  const moodStyles: Record<string, React.CSSProperties> = {
    'mood-great': { backgroundColor: 'hsl(142.1 76% 45%)', color: 'white', borderColor: 'transparent' },
    'mood-good': { backgroundColor: 'hsl(221.2 83% 53%)', color: 'white', borderColor: 'transparent' },
    'mood-okay': { backgroundColor: 'hsl(47.9 96% 53%)', color: 'black', borderColor: 'transparent' },
    'mood-bad': { backgroundColor: 'hsl(24.6 95% 53%)', color: 'white', borderColor: 'transparent' },
    'mood-terrible': { backgroundColor: 'hsl(0 84% 60%)', color: 'white', borderColor: 'transparent' },
    'delivery-text': { backgroundColor: 'hsl(210 100% 45%)', color: 'white', borderColor: 'transparent' },
    'delivery-audio': { backgroundColor: 'hsl(195 100% 50%)', color: 'white', borderColor: 'transparent' },
    'delivery-call': { backgroundColor: 'hsl(15 90% 55%)', color: 'white', borderColor: 'transparent' },
  };

  const style = variant && moodStyles[variant as string] ? moodStyles[variant as string] : undefined;

  return (
    <div 
      className={cn(badgeVariants({ variant: style ? undefined : variant }), className)} 
      style={style}
      {...props} 
    />
  );
}

export { Badge, badgeVariants };
