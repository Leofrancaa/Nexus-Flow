"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  CreditCard,
  Home,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Rotas que, apesar de terem URL própria, pertencem a esta aba. */
  owns?: string[];
}

const TABS: Tab[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  {
    label: "Atividades",
    href: "/atividades",
    icon: ArrowLeftRight,
    owns: ["/despesas", "/receitas"],
  },
  { label: "Cartões", href: "/cartoes", icon: CreditCard },
  { label: "Assistente", href: "/assistente", icon: Sparkles },
  {
    label: "Perfil",
    href: "/perfil",
    icon: User,
    // O hub do perfil é a porta de entrada destas telas; sem isso a barra
    // ficaria sem nenhuma aba acesa ao navegar para dentro delas.
    owns: ["/categorias", "/limites", "/planos", "/configuracoes", "/manual"],
  },
];

function isActive(pathname: string, tab: Tab): boolean {
  const matches = (route: string) =>
    pathname === route || pathname.startsWith(`${route}/`);
  return matches(tab.href) || (tab.owns?.some(matches) ?? false);
}

/**
 * Navegação principal do app — cinco abas fixas no rodapé.
 *
 * Fica sobre o conteúdo com `backdrop-blur` em vez de fundo opaco: a rolagem
 * continua visível por baixo, o que mantém a noção de que a lista continua.
 * A folga do aparelho entra por `env(safe-area-inset-bottom)`; a altura total
 * é o token `--spacing-nav`, que as páginas usam como `pb-nav`.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-bg/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-[430px] items-stretch">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab);
          const Icon = tab.icon;

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 transition-colors",
                  active ? "text-brand" : "text-subtle hover:text-muted"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition-all",
                    active && "bg-brand/12 glow-sm"
                  )}
                >
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={active ? 2.4 : 1.9}
                    aria-hidden="true"
                  />
                </span>
                <span
                  className={cn(
                    "text-[10px] leading-none",
                    active ? "font-semibold" : "font-medium"
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
