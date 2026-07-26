import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";
import type { LinkProps } from "react-router";
import { cx } from "../lib/cx";

export type ButtonVariant = "primary" | "secondary" | "danger" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Hazard yellow is the decision colour, so `primary` is rationed: one per
 * screen, on the action the page exists to get done. Everything else is the
 * ruled outline.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border border-bp-ink bg-bp-hazard text-bp-ink hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-bp-ink)] active:translate-y-0 active:shadow-none",
  secondary:
    "border border-bp-ink bg-transparent text-bp-ink hover:bg-bp-ink hover:text-bp-vellum",
  danger:
    "border border-bp-flag bg-transparent text-bp-flag hover:bg-bp-flag hover:text-bp-vellum",
  quiet:
    "border border-transparent bg-transparent text-bp-line underline decoration-dotted underline-offset-4 hover:text-bp-ink",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[9px]",
  md: "px-5 py-2.5 text-[10px]",
  lg: "px-7 py-3.5 text-[10px]",
};

function classes(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  className?: string,
): string {
  return cx(
    "bp-anno bp-focus inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-150",
    "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-none",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classes(variant, size, fullWidth, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = LinkProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function ButtonLink({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={classes(variant, size, fullWidth, className)} {...rest}>
      {children}
    </Link>
  );
}
