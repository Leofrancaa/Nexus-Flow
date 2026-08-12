// src/app/dashboard/page.tsx
"use client";

import { useCallback, useState } from "react";
import { GreetingHeader } from "@/components/layout/greetingHeader";
import { PageWrapper } from "@/components/layout/pageWrapper";
import { DashboardCards } from "@/components/cards/dashboardStatsCard";
import { DashboardFilter } from "@/components/filters/dashboardFilter";
import { useDataChanged } from "@/hooks/useDataRefresh";
import BalanceChart from "@/components/charts/balanceChart";
import { ExpenseByCategoryChart } from "../../components/charts/expenseByCategoryChart";
import { IncomeByCategoryPieChart } from "../../components/charts/incomeByCategoryPieChart";
import { DashboardInsightsCard } from "@/components/cards/dashboardInsightsCard";
import { CarryoverBanner } from "@/components/cards/carryoverBanner";
import { HealthScoreCard } from "@/components/cards/healthScoreCard";

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados para controlar mês/ano personalizados
  const [customMonth, setCustomMonth] = useState<string>(
    String(new Date().getMonth() + 1)
  );
  const [customYear, setCustomYear] = useState<string>(
    String(new Date().getFullYear())
  );

  // Handlers para mudança de mês/ano
  const handleMonthChange = (mes: string) => {
    setCustomMonth(mes);
  };

  const handleYearChange = (ano: string) => {
    setCustomYear(ano);
  };

  // O lançamento manual saiu daqui para o FAB, que vive no layout — o aviso de
  // "criei algo" chega por evento.
  useDataChanged(useCallback(() => setRefreshKey((prev) => prev + 1), []));

  return (
    <PageWrapper>
      <GreetingHeader />

      {/* Banner de Carryover de Saldo */}
      <div className="mt-4 w-full">
        <CarryoverBanner
          customMonth={customMonth}
          customYear={customYear}
          refreshKey={refreshKey}
          onApplied={() => setRefreshKey((prev) => prev + 1)}
        />
      </div>

      {/* Filtro de Mês/Ano + Cards de Metas + Alertas de Limites + Saúde Financeira */}
      {/* Uma coluna só: os breakpoints do Tailwind olham a janela, não o
          container de 430px — em telas largas o grid antigo espremia os cards
          dentro da coluna estreita. */}
      <div className="mt-6 grid w-full grid-cols-1 gap-4 items-stretch">
        <div className="w-full">
          <DashboardFilter
            onCustomMonthChange={handleMonthChange}
            onCustomYearChange={handleYearChange}
          />
        </div>
        <div className="flex flex-col">
          <DashboardInsightsCard
            customMonth={customMonth}
            customYear={customYear}
            refreshKey={refreshKey}
            onlyGoals
          />
        </div>
        <div className="flex flex-col">
          <DashboardInsightsCard
            customMonth={customMonth}
            customYear={customYear}
            refreshKey={refreshKey}
            onlyAlerts
          />
        </div>
        <div className="flex flex-col">
          <HealthScoreCard refreshKey={refreshKey} />
        </div>
      </div>

      {/* Cards de Estatísticas com mês/ano personalizados */}
      <DashboardCards
        customMonth={customMonth}
        customYear={customYear}
        refreshKey={refreshKey}
      />

      {/* Gráfico de Balanço Mensal */}
      <div className="mt-10 w-full">
        <BalanceChart refreshKey={refreshKey} />
      </div>

      {/* Gráficos por Categoria com mês/ano personalizados */}
      <div className="mt-10 flex w-full flex-col justify-between gap-4">
        <ExpenseByCategoryChart
          mes={Number(customMonth)}
          ano={Number(customYear)}
          refreshKey={refreshKey}
        />

        <IncomeByCategoryPieChart
          mes={Number(customMonth)}
          ano={Number(customYear)}
          refreshKey={refreshKey}
        />
      </div>

      {/* Cards de Cartão e Plano */}
      <div className="mt-10 w-full">
        <DashboardInsightsCard
          customMonth={customMonth}
          customYear={customYear}
          refreshKey={refreshKey}
          onlyCards
        />
      </div>
    </PageWrapper>
  );
}
