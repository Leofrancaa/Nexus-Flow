import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export default function AddButton({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  const base =
    "flex min-h-12 cursor-pointer items-center justify-center rounded-[14px] px-5 py-3.5 text-base font-semibold transition-[background-color,color,opacity,transform,box-shadow] duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary:
      "bg-brand text-bg glow-sm hover:opacity-90",
    secondary: "bg-elevated text-fg hover:bg-line",
    ghost:
      "border border-line bg-transparent text-muted hover:bg-elevated hover:text-fg",
  };

  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      <Plus className="mr-2 h-4 w-4" />
      {children}
    </button>
  );
}
