"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Componente raiz
export const Select = SelectPrimitive.Root;

// Gatilho estilizado
export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-14 w-full items-center justify-between rounded-[14px] border px-4 py-3 text-base transition-[border-color,box-shadow,background-color] duration-200",
      "bg-[var(--select-trigger-bg)] border-[var(--select-trigger-border)] text-[var(--select-trigger-text)]",
      "focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/20",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-[var(--select-icon)]" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

// Lista de opções
export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "z-[120] mt-1 max-h-60 overflow-hidden rounded-[14px] border shadow-[0_24px_60px_rgba(0,0,0,.55)]",
        "bg-[var(--select-content-bg)] border-[var(--select-trigger-border)] text-[var(--select-trigger-text)]",
        className
      )}
      position="popper"
    >
      <SelectPrimitive.ScrollUpButton className="flex justify-center py-1">
        <ChevronUp className="h-4 w-4 text-[var(--select-icon)]" />
      </SelectPrimitive.ScrollUpButton>

      <SelectPrimitive.Viewport
        className="p-1"
        style={{ width: "var(--radix-select-trigger-width)" }}
      >
        {children}
      </SelectPrimitive.Viewport>

      <SelectPrimitive.ScrollDownButton className="flex justify-center py-1">
        <ChevronDown className="h-4 w-4 text-[var(--select-icon)]" />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

// Item
export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ children, className, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex min-h-11 cursor-pointer select-none items-center justify-between rounded-[10px] px-4 py-2 text-base",
      "text-[var(--select-trigger-text)] hover:bg-[var(--select-item-hover)] focus:bg-[var(--select-item-hover)] focus:outline-none",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="absolute right-2">
      <Check className="h-4 w-4 text-[var(--select-check)]" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

// Valor
export const SelectValue = SelectPrimitive.Value;
