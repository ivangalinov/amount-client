import { describe, it, expect } from "vitest";
import type { DashboardStatsParams } from "@/entities/stats/api/types";
import type { DashboardStats } from "@/entities/stats/model/types";
import { statsLocalStorageApi } from "@/entities/stats/api/local-storage";

describe("stats API (getDashboardStats)", () => {
  it("returns full DashboardStats shape with empty data when storage has no operations", async () => {
    const params: DashboardStatsParams = {
      workspaceId: 1,
      dateFrom: "2025-03-01T00:00:00.000Z",
      dateTo: "2025-03-31T23:59:59.999Z",
    };

    const result = await statsLocalStorageApi.getDashboardStats(params);

    const expected: DashboardStats = {
      balance: 0,
      totalIncome: 0,
      totalExpense: 0,
      expensesByCategory: [],
      incomeByCategory: [],
      expensesByDay: [],
      expensesByMonth: [],
    };
    expect(result).toEqual(expected);
    expect(Object.keys(result).sort()).toEqual(
      Object.keys(expected).sort()
    );
  });
});
