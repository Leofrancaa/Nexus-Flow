"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  FolderKanban,
  Gauge,
  Landmark,
  LogOut,
  Settings,
  Target,
  type LucideIcon,
} from "lucide-react";

import { PageWrapper } from "@/components/layout/pageWrapper";
import { getUserData, logout } from "@/lib/auth";

interface ItemHub {
  label: string;
  descricao: string;
  href: string;
  icon: LucideIcon;
}

const ITENS: ItemHub[] = [
  {
    label: "Open Finance",
    descricao: "Conecte bancos e sincronize transações",
    href: "/open-finance",
    icon: Landmark,
  },
  {
    label: "Categorias",
    descricao: "Organize entradas e saídas",
    href: "/categorias",
    icon: FolderKanban,
  },
  {
    label: "Limites e metas",
    descricao: "Tetos por categoria e objetivos",
    href: "/limites",
    icon: Gauge,
  },
  {
    label: "Planos",
    descricao: "Investimentos e reservas",
    href: "/planos",
    icon: Target,
  },
  {
    label: "Configurações",
    descricao: "Conta, moeda e preferências",
    href: "/configuracoes",
    icon: Settings,
  },
  {
    label: "Manual",
    descricao: "Como o app funciona",
    href: "/manual",
    icon: BookOpen,
  },
];

/**
 * Hub do perfil.
 *
 * As telas de configuração são as menos visitadas do app — em vez de gastar
 * uma aba com cada uma, elas entram aqui como lista. A quinta aba fica sendo
 * a porta de entrada de tudo que não é consulta do dia a dia.
 */
export default function PerfilPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    getUserData()
      .then((user) => {
        if (user?.nome) setNome(user.nome);
        if (user?.email) setEmail(user.email);
      })
      .catch(() => {
        /* o hub continua útil sem os dados do usuário */
      });
  }, []);

  const sair = async () => {
    await logout();
    router.push("/login");
  };

  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <PageWrapper className="pt-8">
      <header className="relative -mx-5 mb-6 px-5 pb-2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-8 h-[220px] bg-[url('/aurora.svg')] bg-cover bg-top bg-no-repeat"
        />
        <div className="relative flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand/12 font-display text-lg font-bold text-brand"
          >
            {iniciais || "•"}
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold tracking-tight text-fg">
              {nome || "Perfil"}
            </h1>
            {email && <p className="truncate text-sm text-muted">{email}</p>}
          </div>
        </div>
      </header>

      <nav aria-label="Ajustes">
        <ul className="overflow-hidden rounded-2xl bg-surface">
          {ITENS.map(({ label, descricao, href, icon: Icon }, i) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-elevated"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-elevated text-muted">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-fg">{label}</span>
                  <span className="block truncate text-xs text-muted">
                    {descricao}
                  </span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-subtle"
                  aria-hidden="true"
                />
              </Link>
              {i < ITENS.length - 1 && (
                <div className="ml-16 h-px bg-line" aria-hidden="true" />
              )}
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        onClick={sair}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-4 font-semibold text-negative transition-colors hover:bg-negative/10"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Sair da conta
      </button>
    </PageWrapper>
  );
}
