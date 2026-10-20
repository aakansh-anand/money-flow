import { cva, type VariantProps } from "class-variance-authority";
import NextLink from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const linkVariants = cva(
  "underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "text-primary",
        muted: "text-muted-foreground hover:text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type LinkProps = ComponentProps<typeof NextLink> &
  VariantProps<typeof linkVariants>;

export function Link({ className, variant, ...props }: LinkProps) {
  return (
    <NextLink className={cn(linkVariants({ variant }), className)} {...props} />
  );
}
