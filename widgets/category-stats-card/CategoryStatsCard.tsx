"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import type { ICategoryStatItem } from "@/entities/stats/model/types";

const CategoryPieChart = dynamic(
  () =>
    import("@/widgets/expenses-pie-chart").then((m) => m.ExpensesPieChart),
  { ssr: false }
);

const CategoryBarChart = dynamic(
  () =>
    import("./CategoryBarChart").then((m) => m.CategoryBarChart),
  { ssr: false }
);

export type CategoryStatsVariant = "expense" | "income";

export type CategoryStatsChartMode = "pie" | "bar";

export interface ICategoryStatsCardProps {
  /** Заголовок карточки */
  title: string;
  /** Данные по категориям (расходы или доходы) */
  items: ICategoryStatItem[];
  /** Вариант: цвет сумм и текст пустого состояния */
  variant: CategoryStatsVariant;
  /** Высота диаграммы */
  chartHeight?: number;
}

const variantConfig = {
  expense: {
    amountClassName: "text-danger font-medium",
    amountFormat: (sum: number) => sum.toFixed(2),
    emptyText: "Нет расходов за период",
  },
  income: {
    amountClassName: "text-success font-medium",
    amountFormat: (sum: number) => `+${sum.toFixed(2)}`,
    emptyText: "Нет доходов за период",
  },
} as const;

export function CategoryStatsCard({
  title,
  items,
  variant,
  chartHeight = 280,
}: ICategoryStatsCardProps) {
  const config = variantConfig[variant];
  const [chartMode, setChartMode] = useState<CategoryStatsChartMode>("pie");

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-lg font-medium">{title}</h2>
        {items.length > 0 && (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={chartMode === "pie" ? "solid" : "flat"}
              color={chartMode === "pie" ? "primary" : "default"}
              onPress={() => setChartMode("pie")}
            >
              Круг
            </Button>
            <Button
              size="sm"
              variant={chartMode === "bar" ? "solid" : "flat"}
              color={chartMode === "bar" ? "primary" : "default"}
              onPress={() => setChartMode("bar")}
            >
              Гистограмма
            </Button>
          </div>
        )}
      </div>
      {items.length > 0 ? (
        <>
          {chartMode === "pie" ? (
            <CategoryPieChart data={items} height={chartHeight} />
          ) : (
            <CategoryBarChart data={items} height={chartHeight} />
          )}
          <ul className="mt-4 pt-4 border-t border-default-200 space-y-2">
            {items.map(({ categoryId, name, color, sum }) => (
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
                <span className={`shrink-0 ${config.amountClassName}`}>
                  {config.amountFormat(sum)}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-default-400 py-4">{config.emptyText}</p>
      )}
    </Card>
  );
}
