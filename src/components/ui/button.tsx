import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Boba Bash button — chunky 2px borders, hard offset shadows,
 * Baloo 2 display font. Variants mirror the branding guide.
 */
const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg font-display font-bold transition-[transform,box-shadow,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bubble-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-[2px] active:shadow-none",
  {
    variants: {
      variant: {
        default:
          "border-2 border-line bg-goldenrod text-ink shadow-control hover:bg-[#f6cd6b]",
        bubble:
          "border-2 border-bubble-ink bg-bubble text-bubble-ink shadow-control hover:bg-[#bce0f2]",
        gradient:
          "border-2 border-line text-ink-muted shadow-control hover:text-ink",
        outline:
          "border-2 border-line bg-surface text-ink shadow-control hover:bg-surface-alt",
        ghost: "text-ink-muted hover:bg-surface-alt hover:text-ink",
        destructive:
          "border-2 border-[#7c2d1f] bg-destructive text-white shadow-control hover:bg-[#c94f3b]",
        link: "text-bubble-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "px-5 py-2.5 text-[15px]",
        sm: "px-3 py-1.5 text-sm",
        lg: "px-7 py-3 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
