"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CarFront,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Plane,
  Popcorn,
  ReceiptText,
  Shapes,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import { PageWrapper } from "@/components/layout/pageWrapper";
import { Money } from "@/components/ui/money";
import { PrivacyProvider, usePrivacy } from "@/contexts/privacyContext";
import { useDate } from "@/contexts/dateContext";
import { apiRequest } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface CategorySummary {
  id: number;
  nome: string;
  cor: string;
  quantidade: number;
  total: number;
  percentual: number;
}

interface DisplaySlice {
  key: string;
  nome: string;
  cor: string;
  quantidade: number;
  total: number;
}

interface GroupSlice extends DisplaySlice {
  members: CategorySummary[];
}

const GROUPS = [
  {
    name: "Essenciais",
    color: "#ff7417",
    terms: ["aliment", "mercado", "moradia", "casa", "saude", "educa", "transporte"],
  },
  {
    name: "Estilo de vida",
    color: "#ed3e96",
    terms: ["compra", "lazer", "viagem", "restaurante", "assinatura", "servico"],
  },
  {
    name: "Financeiro",
    color: "#8b5cf6",
    terms: ["transfer", "imposto", "taxa", "seguro", "banco", "cartao"],
  },
] as const;

const ICONS: Array<{ terms: string[]; icon: LucideIcon }> = [
  { terms: ["aliment", "mercado", "restaurante"], icon: ShoppingCart },
  { terms: ["compra"], icon: ShoppingBag },
  { terms: ["servico", "assinatura", "digital", "telefone"], icon: Smartphone },
  { terms: ["educa", "curso", "escola"], icon: GraduationCap },
  { terms: ["moradia", "casa", "aluguel"], icon: House },
  { terms: ["transporte", "uber", "combust"], icon: CarFront },
  { terms: ["saude", "farmacia", "academia"], icon: HeartPulse },
  { terms: ["viagem"], icon: Plane },
  { terms: ["imposto", "taxa", "banco"], icon: Landmark },
  { terms: ["seguro"], icon: ShieldCheck },
  { terms: ["lazer", "cinema"], icon: Popcorn },
  { terms: ["conta", "fatura"], icon: ReceiptText },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function iconFor(name: string) {
  const normalized = normalize(name);
  return ICONS.find(({ terms }) => terms.some((term) => normalized.includes(term)))?.icon ?? Shapes;
}

function groupCategories(categories: CategorySummary[]): GroupSlice[] {
  const grouped = new Map<string, GroupSlice>();

  for (const category of categories) {
    const normalized = normalize(category.nome);
    const matched = GROUPS.find(({ terms }) => terms.some((term) => normalized.includes(term)));
    const name = matched?.name ?? "Outros";
    const current = grouped.get(name);

    grouped.set(name, {
      key: `group-${normalize(name)}`,
      nome: name,
      cor: matched?.color ?? "#38bdf8",
      quantidade: (current?.quantidade ?? 0) + category.quantidade,
      total: (current?.total ?? 0) + category.total,
      members: [...(current?.members ?? []), category],
    });
  }

  return [...grouped.values()].sort((a, b) => b.total - a.total);
}

function SpendingDonut({ slices, total }: { slices: DisplaySlice[]; total: number }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const gap = 5;
  let offset = 0;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[20rem]" aria-label="Distribuição dos gastos">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-elevated)" strokeWidth="10" />
        {slices.map((slice) => {
          const fraction = total > 0 ? slice.total / total : 0;
          const segmentLength = Math.max(fraction * circumference - gap, 0);
          const dashOffset = -offset;
          offset += fraction * circumference;

          return (
            <circle
              key={slice.key}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={slice.cor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${segmentLength} ${circumference}`}
              strokeDashoffset={dashOffset}
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-14 text-center">
        <Money
          value={total}
          className={cn("text-[2rem] font-bold leading-none", total > 3600 ? "text-negative" : "text-fg")}
        />
        <span className="mt-2 text-sm text-muted">gastos este mês</span>
      </div>
    </div>
  );
}

const BUBBLE_POSITIONS = [
  { left: "50%", top: "47%", base: 142 },
  { left: "20%", top: "27%", base: 108 },
  { left: "79%", top: "28%", base: 96 },
  { left: "22%", top: "72%", base: 86 },
] as const;

function GroupBubbleCloud({ groups, total }: { groups: GroupSlice[]; total: number }) {
  const largest = Math.max(...groups.map((group) => group.total), 1);

  return (
    <section className="mt-5" aria-label="Distribuição por grupos">
      <div className="relative mx-auto h-[19rem] w-full max-w-[23rem] overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-x-[12%] bottom-[8%] h-24 rounded-full bg-brand/[0.035] blur-2xl"
        />
        {groups.slice(0, 4).map((group, index) => {
          const position = BUBBLE_POSITIONS[index];
          const scale = 0.72 + (group.total / largest) * 0.28;
          const size = Math.round(position.base * scale);
          const Icon = iconFor(group.members[0]?.nome ?? group.nome);
          const percentage = total > 0 ? (group.total / total) * 100 : 0;

          return (
            <div
              key={group.key}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border text-center shadow-[inset_0_0_28px_rgba(255,255,255,.025),0_18px_40px_rgba(0,0,0,.2)]"
              style={{
                left: position.left,
                top: position.top,
                width: size,
                height: size,
                borderColor: `${group.cor}80`,
                color: group.cor,
                background: `radial-gradient(circle at 34% 28%, ${group.cor}35, ${group.cor}12 58%, ${group.cor}08)`,
              }}
            >
              <Icon className="mb-1 h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              <span className="num text-xl font-bold">{Math.round(percentage)}%</span>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-muted">Gastos agrupados neste mês</p>
      <Money
        value={total}
        className={cn("mt-0.5 block text-3xl font-bold", total > 3600 ? "text-negative" : "text-fg")}
      />
    </section>
  );
}

export default function CategorySpendingPage() {
  return (
    <PrivacyProvider>
      <CategorySpending />
    </PrivacyProvider>
  );
}

function CategorySpending() {
  const router = useRouter();
  const { selectedMonth, selectedYear, setMonth, setYear } = useDate();
  const { oculto, alternar } = usePrivacy();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [view, setView] = useState<"categories" | "groups">("categories");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiRequest(`/api/expenses/category-resume?mes=${selectedMonth}&ano=${selectedYear}`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Não foi possível carregar os gastos.");
        if (!cancelled) setCategories(body.data ?? []);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Erro ao carregar categorias.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMonth, selectedYear]);

  const changeMonth = useCallback(
    (direction: -1 | 1) => {
      const next = selectedMonth + direction;
      if (next < 1) {
        setMonth(12);
        setYear(selectedYear - 1);
      } else if (next > 12) {
        setMonth(1);
        setYear(selectedYear + 1);
      } else {
        setMonth(next);
      }
      setExpanded(null);
    },
    [selectedMonth, selectedYear, setMonth, setYear]
  );

  const categorySlices = useMemo<DisplaySlice[]>(() => {
    return categories.map((category) => ({
      key: `category-${category.id}`,
      nome: category.nome,
      cor: category.cor,
      quantidade: category.quantidade,
      total: category.total,
    }));
  }, [categories]);

  const groups = useMemo(() => groupCategories(categories), [categories]);

  const total = useMemo(
    () => categorySlices.reduce((sum, slice) => sum + slice.total, 0),
    [categorySlices]
  );
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
        new Date(selectedYear, selectedMonth - 1, 1)
      ),
    [selectedMonth, selectedYear]
  );

  return (
    <PageWrapper className="min-h-dvh pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-full bg-elevated text-fg transition-[background-color,transform] hover:bg-line active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full bg-elevated px-1 py-1">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Mês anterior"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-line hover:text-fg"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center font-display text-sm font-bold text-fg">
            <span className="capitalize">{monthLabel}</span>
          </h1>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Próximo mês"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-line hover:text-fg"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={alternar}
          aria-pressed={oculto}
          aria-label={oculto ? "Mostrar valores" : "Ocultar valores"}
          className="flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-full bg-elevated text-fg transition-[background-color,transform] hover:bg-line active:scale-95"
        >
          {oculto ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      </header>

      {loading ? (
        <div className="mx-auto mt-12 aspect-square w-full max-w-[20rem] animate-pulse rounded-full border-[2.25rem] border-elevated" />
      ) : categories.length > 0 ? (
        view === "groups" ? (
          <GroupBubbleCloud groups={groups} total={total} />
        ) : (
          <SpendingDonut slices={categorySlices} total={total} />
        )
      ) : (
        <div className="mx-auto mt-12 flex aspect-square w-full max-w-[19rem] flex-col items-center justify-center rounded-full border-[1.15rem] border-elevated px-10 text-center">
          <Shapes className="h-7 w-7 text-subtle" aria-hidden="true" />
          <p className="mt-3 font-semibold text-fg">Nenhum gasto neste mês</p>
          <p className="mt-1 text-xs text-muted">As categorias aparecerão depois da sincronização.</p>
        </div>
      )}

      <div className="mt-2 grid grid-cols-2 rounded-full bg-elevated p-1" role="group" aria-label="Forma de agrupamento">
        <button
          type="button"
          onClick={() => setView("categories")}
          aria-pressed={view === "categories"}
          className={cn(
            "min-h-12 rounded-full px-4 font-semibold transition-[background-color,color,transform] active:scale-[.98]",
            view === "categories" ? "bg-fg text-bg" : "text-muted hover:text-fg"
          )}
        >
          Categorias
        </button>
        <button
          type="button"
          onClick={() => setView("groups")}
          aria-pressed={view === "groups"}
          className={cn(
            "min-h-12 rounded-full px-4 font-semibold transition-[background-color,color,transform] active:scale-[.98]",
            view === "groups" ? "bg-fg text-bg" : "text-muted hover:text-fg"
          )}
        >
          Grupos
        </button>
      </div>

      {view === "categories" ? (
      <ul className="mt-5 space-y-3">
        {categorySlices.map((slice) => {
          const percentage = total > 0 ? (slice.total / total) * 100 : 0;
          const Icon = iconFor(slice.nome);
          const isExpanded = expanded === slice.key;
          const average = slice.quantidade > 0 ? slice.total / slice.quantidade : 0;

          return (
            <li key={slice.key} className="overflow-hidden rounded-[1.4rem] bg-surface">
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : slice.key)}
                aria-expanded={isExpanded}
                className="flex min-h-[5.25rem] w-full touch-manipulation items-center gap-3 p-4 text-left transition-[background-color] hover:bg-elevated/55"
              >
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-[0_8px_24px_-12px_currentColor]"
                  style={{ backgroundColor: slice.cor }}
                >
                  <Icon className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-base font-bold text-fg">{slice.nome}</span>
                  <span className="mt-0.5 block text-sm text-muted">{Math.round(percentage)}%</span>
                </span>

                <Money value={slice.total} className="shrink-0 text-base font-semibold text-fg" />
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 text-subtle transition-transform", isExpanded && "rotate-180")}
                  aria-hidden="true"
                />
              </button>

              {isExpanded ? (
                <div className="grid grid-cols-2 gap-3 border-t border-line px-4 py-3 text-xs">
                  <span className="text-muted">
                    Lançamentos
                    <strong className="mt-1 block text-sm text-fg">{slice.quantidade}</strong>
                  </span>
                  <span className="text-muted">
                    Média por gasto
                    <Money value={average} className="mt-1 block text-sm font-bold text-fg" />
                  </span>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      ) : (
        <ul className="mt-5 space-y-3">
          {groups.map((group) => {
            const percentage = total > 0 ? (group.total / total) * 100 : 0;
            const isExpanded = expanded === group.key;

            return (
              <li key={group.key} className="overflow-hidden rounded-[1.4rem] border border-white/[0.05] bg-surface">
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : group.key)}
                  aria-expanded={isExpanded}
                  className="w-full touch-manipulation p-4 text-left transition-colors hover:bg-elevated/55"
                >
                  <span className="flex items-start gap-3">
                    <span className="mt-1 h-11 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: group.cor }} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate font-display text-base font-bold text-fg">{group.nome}</span>
                        <Money value={group.total} className="shrink-0 text-base font-semibold text-fg" />
                      </span>
                      <span className="mt-1 flex items-center justify-between text-xs text-muted">
                        <span>{group.members.length} {group.members.length === 1 ? "categoria" : "categorias"}</span>
                        <span className="num">{Math.round(percentage)}%</span>
                      </span>
                      <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-elevated">
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${percentage}%`, backgroundColor: group.cor }}
                        />
                      </span>
                    </span>
                    <ChevronDown
                      className={cn("mt-1 h-4 w-4 shrink-0 text-subtle transition-transform", isExpanded && "rotate-180")}
                      aria-hidden="true"
                    />
                  </span>
                </button>

                {isExpanded ? (
                  <ul className="border-t border-line px-4 py-2">
                    {group.members.sort((a, b) => b.total - a.total).map((member) => (
                      <li key={member.id} className="flex items-center gap-2 py-2 text-sm">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: member.cor }} aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-muted">{member.nome}</span>
                        <Money value={member.total} className="shrink-0 font-semibold text-fg" />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </PageWrapper>
  );
}
