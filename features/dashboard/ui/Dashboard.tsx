"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { observer } from "mobx-react-lite";
import { Card } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { useRootStore } from "@/shared/store/root-store";
import { DateRangeFilter } from "@/shared/ui/DateRangeFilter";
import { getDefaultDateFrom, getDefaultDateTo } from "@/shared/lib/date";

const ExpensesPieChart = dynamic(() => import("@/widgets/expenses-pie-chart").then((m) => m.ExpensesPieChart), { ssr: false });

function formatMonth(ym: string): string {
  const [, m] = ym.split("-");
  const months = [
    "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
    "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
  ];
  return `${months[Number(m) - 1]} ${ym.slice(0, 4)}`;
}

export const Dashboard = observer(function Dashboard() {
  const { user, workspace, stats } = useRootStore();

  const [dateFrom, setDateFrom] = useState(() => getDefaultDateFrom());
  const [dateTo, setDateTo] = useState(() => getDefaultDateTo());

  useEffect(() => {
    void user.loadCurrentUser();
    void workspace.loadWorkspaces();
  }, [user, workspace]);

  const activeWorkspace = workspace.activeWorkspace;

  useEffect(() => {
    if (!activeWorkspace) return;
    void stats.loadDashboardStats({
      workspaceId: activeWorkspace.id,
      dateFrom: new Date(dateFrom).toISOString(),
      dateTo: new Date(dateTo + "T23:59:59.999").toISOString(),
    });
  }, [activeWorkspace?.id, dateFrom, dateTo, stats]);

  const loading = stats.loading;
  const error = stats.error;
  const data = stats.dashboardStats;

  return (
    <section className="flex flex-col gap-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold">Дашборд</h1>
        <DateRangeFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onPeriodChange={(from, to) => {
            setDateFrom(from);
            setDateTo(to);
          }}
        />
      </div>

      {loading && !data && (
        <div className="flex items-center gap-2 text-default-500">
          <Spinner size="sm" />
          <span>Загрузка…</span>
        </div>
      )}

      {error && (
        <div className="text-sm text-danger">{error}</div>
      )}

      <div className="flex flex-wrap gap-4">
        <Card className="p-4 min-w-[180px]">
          <div className="text-sm text-default-500">Баланс за период</div>
          <div className="text-2xl font-semibold">
            {(data?.balance ?? 0).toFixed(2)}
          </div>
        </Card>
        <Card className="p-4 min-w-[180px]">
          <div className="text-sm text-default-500">Доходы за период</div>
          <div className="text-2xl font-semibold text-success">
            {(data?.totalIncome ?? 0).toFixed(2)}
          </div>
        </Card>
        <Card className="p-4 min-w-[180px]">
          <div className="text-sm text-default-500">Расходы за период</div>
          <div className="text-2xl font-semibold text-danger">
            {(data?.totalExpense ?? 0).toFixed(2)}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="text-lg font-medium mb-3">Расходы по категориям</h2>
          <ExpensesPieChart
            data={data?.expensesByCategory ?? []}
            height={280}
          />
          {(data?.expensesByCategory?.length ?? 0) > 0 && (
            <ul className="mt-4 pt-4 border-t border-default-200 space-y-2">
              {(data?.expensesByCategory ?? []).map(
                ({ categoryId, name, color, sum }) => (
                  <li
                    key={categoryId}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate">{name}</span>
                    </span>
                    <span className="text-danger font-medium shrink-0">
                      {sum.toFixed(2)}
                    </span>
                  </li>
                )
              )}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-medium mb-3">Доходы по категориям</h2>
          {(data?.incomeByCategory?.length ?? 0) === 0 ? (
            <p className="text-sm text-default-400">Нет доходов за период</p>
          ) : (
            <ul className="space-y-2">
              {(data?.incomeByCategory ?? []).map(
                ({ categoryId, name, color, sum }) => (
                  <li
                    key={categoryId}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate">{name}</span>
                    </span>
                    <span className="text-success font-medium shrink-0">
                      +{sum.toFixed(2)}
                    </span>
                  </li>
                )
              )}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="text-lg font-medium mb-3">Расходы по дням</h2>
          {(data?.expensesByDay?.length ?? 0) === 0 ? (
            <p className="text-sm text-default-400">Нет расходов за период</p>
          ) : (
            <ul className="space-y-1.5 max-h-64 overflow-y-auto">
              {(data?.expensesByDay ?? []).map(({ day, sum }) => (
                <li
                  key={day}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-default-600">
                    {new Date(day).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-danger font-medium">
                    {sum.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-medium mb-3">Расходы по месяцам</h2>
          {(data?.expensesByMonth?.length ?? 0) === 0 ? (
            <p className="text-sm text-default-400">Нет расходов за период</p>
          ) : (
            <ul className="space-y-1.5 max-h-64 overflow-y-auto">
              {(data?.expensesByMonth ?? []).map(({ month, sum }) => (
                <li
                  key={month}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-default-600">
                    {formatMonth(month)}
                  </span>
                  <span className="text-danger font-medium">
                    {sum.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  );
});
