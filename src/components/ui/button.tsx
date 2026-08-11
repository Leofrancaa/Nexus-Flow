import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export default function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  const base =
    "flex w-full cursor-pointer items-center justify-center rounded-xl py-4 " +
    "text-base font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    // Texto escuro sobre a marca: o lima é claro demais para texto branco.
    primary: "bg-brand text-bg glow-sm hover:opacity-90 disabled:shadow-none",
    secondary: "bg-elevated text-fg hover:bg-line",
    ghost: "border border-line bg-transparent text-muted hover:bg-elevated hover:text-fg",
  };

  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
