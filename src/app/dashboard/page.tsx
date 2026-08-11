// src/app/dashboard/page.tsx
"use client";

import { useState } from "react";
import { GreetingHeader } from "@/components/layout/greetingHeader";
import { DashboardCards } from "@/components/cards/dashboardStatsCard";
import { DashboardFilter } from "@/components/filters/dashboardFilter";
import { NewExpenseModal } from "@/components/modals/newExpenseModal";
import { NewIncomeModal } from "@/components/modals/newIncomeModal";
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
  return (
    <main className="flex min-h-screen w-full flex-col overflow-hidden bg-bg px-5 pb-8">
      <GreetingHeader
        action={
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <NewIncomeModal onCreated={() => setRefreshKey((prev) => prev + 1)} />
            <NewExpenseModal
              onCreated={() => setRefreshKey((prev) => prev + 1)}
            />
          </div>
        }
      />

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
      <div className="mt-6 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
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
      <div className="mt-10 w-full flex flex-col lg:flex-row justify-between gap-4">
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
    </main>
  );
}
