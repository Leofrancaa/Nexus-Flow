import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => {
  const classes = cn(
    "flex h-14 w-full rounded-[14px] border border-line bg-elevated px-4 py-3",
    // 16px no celular evita o zoom automático do iOS ao focar o campo.
    "text-base text-fg placeholder-subtle md:text-sm",
    "transition-[border-color,box-shadow,background-color] duration-200 focus:border-brand/60 focus:bg-[#1d2024] focus:outline-none focus:ring-2 focus:ring-brand/20",
    "disabled:cursor-not-allowed disabled:opacity-50"
  );

  return (
    <input ref={ref} type={type} className={cn(classes, className)} {...props} />
  );
});

Input.displayName = "Input";

export { Input };
