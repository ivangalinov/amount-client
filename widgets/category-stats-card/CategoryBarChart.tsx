"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import type { ICategoryStatItem } from "@/entities/stats/model/types";

export interface ICategoryBarChartProps {
  data: ICategoryStatItem[];
  height?: number;
}

export function CategoryBarChart({ data, height = 280 }: ICategoryBarChartProps) {
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
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
      >
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fontSize: 12 }}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: number, _name: string, props: { payload: { name: string } }) => [
            (value as number).toFixed(2),
            props.payload.name,
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid var(--nextui-colors-default-200)",
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} minPointSize={8}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
