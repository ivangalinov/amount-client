import { getApiBase } from "@/shared/lib/api-base";
import { parseFastApiError } from "@/shared/lib/fastapi-error";
import type { IDashboardStats } from "@/entities/stats/model/types";
import type { CategoryId } from "@/entities/category/model/types";
import type { IStatsApi, IDashboardStatsParams } from "@/entities/stats/api/types";

type ApiCategoryStatRow = {
  category_id?: number;
  name?: string;
  color?: string;
  sum?: number;
};

type ApiDayStatRow = {
  day?: string;
  sum?: number;
};

type ApiMonthStatRow = {
  month?: string;
  sum?: number;
};

type ApiDashboardStats = {
  balance?: number;
  total_income?: number;
  total_expense?: number;
  expenses_by_category?: ApiCategoryStatRow[];
  income_by_category?: ApiCategoryStatRow[];
  expenses_by_day?: ApiDayStatRow[];
  expenses_by_month?: ApiMonthStatRow[];
};

function mapCategoryStat(row: ApiCategoryStatRow) {
  return {
    categoryId: (row.category_id ?? 0) as CategoryId,
    name: String(row.name ?? "—"),
    color: String(row.color ?? "#888"),
    sum: Number(row.sum ?? 0),
  };
}

function mapDashboardStats(raw: ApiDashboardStats): IDashboardStats {
  return {
    balance: Number(raw.balance ?? 0),
    totalIncome: Number(raw.total_income ?? 0),
    totalExpense: Number(raw.total_expense ?? 0),
    expensesByCategory: (raw.expenses_by_category ?? []).map(mapCategoryStat),
    incomeByCategory: (raw.income_by_category ?? []).map(mapCategoryStat),
    expensesByDay: (raw.expenses_by_day ?? []).map((r) => ({
      day: String(r.day ?? ""),
      sum: Number(r.sum ?? 0),
    })),
    expensesByMonth: (raw.expenses_by_month ?? []).map((r) => ({
      month: String(r.month ?? ""),
      sum: Number(r.sum ?? 0),
    })),
  };
}

export default class StatsRemoteApi implements IStatsApi {
  async getDashboardStats(
    params: IDashboardStatsParams,
  ): Promise<IDashboardStats> {
    const searchParams = new URLSearchParams();
    searchParams.set("workspace_id", String(params.workspaceId));
    if (params.dateFrom) {
      searchParams.set("date_from", params.dateFrom);
    }
    if (params.dateTo) {
      searchParams.set("date_to", params.dateTo);
    }

    const res = await fetch(
      `${getApiBase()}/stats/dashboard?${searchParams.toString()}`,
      { method: "GET", credentials: "include" },
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        parseFastApiError(errText) || `HTTP ${res.status} ${res.statusText}`,
      );
    }

    const raw = (await res.json()) as ApiDashboardStats;
    return mapDashboardStats(raw);
  }
}
