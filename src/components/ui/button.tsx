import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-180 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary px-4 py-2.5 text-white hover:bg-primary-hover active:translate-y-px",
        secondary: "border border-border bg-white px-4 py-2.5 text-ink hover:bg-elevated",
        ghost: "px-3 py-2 text-muted hover:bg-primary-soft hover:text-primary",
      },
      size: { sm: "h-9", md: "h-10", lg: "h-11 px-5" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
