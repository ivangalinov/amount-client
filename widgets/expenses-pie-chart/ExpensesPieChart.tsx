"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

export interface ExpensesPieChartItem {
  categoryId: number;
  name: string;
  color: string;
  sum: number;
}

interface ExpensesPieChartProps {
  data: ExpensesPieChartItem[];
  height?: number;
}

export function ExpensesPieChart({ data, height = 280 }: ExpensesPieChartProps) {
  const chartData = data.map((item) => ({
    name: item.name,
    value: Math.abs(item.sum),
    fill: item.color,
  }));

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-default-400 text-sm"
        style={{ height }}
      >
        Нет данных за период
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius="50%"
          outerRadius="80%"
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value.toFixed(2)}`, "Сумма"]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid var(--nextui-colors-default-200)",
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value, entry) => (
            <span className="text-default-700 text-sm">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
