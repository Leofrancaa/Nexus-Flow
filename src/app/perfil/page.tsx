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
  ShieldCheck,
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
      <header className="relative isolate mb-6 overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-surface px-5 py-5 shadow-[0_24px_70px_-42px_rgba(190,255,0,.4)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[url('/aurora.svg')] bg-cover bg-top bg-no-repeat opacity-80"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-16 -z-10 h-40 w-40 rounded-full bg-brand/15 blur-3xl"
        />
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-brand/20 bg-brand/10 font-display text-lg font-bold text-brand shadow-[inset_0_0_24px_rgba(190,255,0,.08)]"
          >
            {iniciais || "•"}
            <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-surface bg-brand" />
          </span>
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-brand">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Conta pessoal
            </div>
            <h1 className="truncate font-display text-2xl font-bold tracking-tight text-fg">
              {nome || "Perfil"}
            </h1>
            {email && <p className="truncate text-sm text-muted">{email}</p>}
          </div>
        </div>
      </header>

      <nav aria-label="Ajustes" className="relative z-10">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="font-display text-base font-bold text-fg">Conta e preferências</h2>
          <span className="text-[10px] font-bold uppercase tracking-[.14em] text-subtle">Nexus</span>
        </div>
        <ul className="overflow-hidden rounded-[1.5rem] border border-white/[0.07] bg-surface">
          {ITENS.map(({ label, descricao, href, icon: Icon }, i) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex min-h-[4.75rem] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/70"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${i === 0 ? "bg-brand/10 text-brand" : "bg-elevated text-muted group-hover:text-fg"}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-fg">{label}</span>
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
        className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-negative/10 bg-surface font-semibold text-negative transition-colors hover:bg-negative/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative/60"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Sair da conta
      </button>
    </PageWrapper>
  );
}
