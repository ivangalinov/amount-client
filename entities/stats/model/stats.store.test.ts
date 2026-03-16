import { describe, it, expect, beforeEach } from "vitest";
import type { DashboardStats } from "@/entities/stats/model/types";
import type { StatsApi, DashboardStatsParams } from "@/entities/stats/api/types";
import { StatsStore } from "@/entities/stats/model/stats.store";

function createMockStatsApi(overrides: Partial<{
  getDashboardStats: StatsApi["getDashboardStats"];
}> = {}): StatsApi {
  return {
    getDashboardStats: async (_params: DashboardStatsParams): Promise<DashboardStats> => ({
      balance: 0,
      totalIncome: 0,
      totalExpense: 0,
      expensesByCategory: [],
      incomeByCategory: [],
      expensesByDay: [],
      expensesByMonth: [],
    }),
    ...overrides,
  };
}

describe("StatsStore", () => {
  let store: StatsStore;

  beforeEach(() => {
    store = new StatsStore(createMockStatsApi());
  });

  describe("initial state", () => {
    it("has null dashboardStats", () => {
      expect(store.dashboardStats).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe("loadDashboardStats", () => {
    it("sets dashboardStats from API", async () => {
      const stats: DashboardStats = {
        balance: 500,
        totalIncome: 2000,
        totalExpense: -1500,
        expensesByCategory: [
          { categoryId: 1, name: "Еда", color: "#f00", sum: -800 },
        ],
        incomeByCategory: [
          { categoryId: 2, name: "Зарплата", color: "#0f0", sum: 2000 },
        ],
        expensesByDay: [{ day: "2025-03-01", sum: -100 }],
        expensesByMonth: [{ month: "2025-03", sum: -1500 }],
      };
      const api = createMockStatsApi({
        getDashboardStats: async () => stats,
      });
      store = new StatsStore(api);

      await store.loadDashboardStats({
        workspaceId: 1,
        dateFrom: "2025-03-01T00:00:00.000Z",
        dateTo: "2025-03-31T23:59:59.999Z",
      });

      expect(store.dashboardStats).toEqual(stats);
      expect(store.dashboardStats?.balance).toBe(500);
      expect(store.dashboardStats?.totalIncome).toBe(2000);
      expect(store.dashboardStats?.totalExpense).toBe(-1500);
      expect(store.dashboardStats?.expensesByCategory).toHaveLength(1);
      expect(store.dashboardStats?.expensesByCategory[0].name).toBe("Еда");
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it("sets error when API throws", async () => {
      const api = createMockStatsApi({
        getDashboardStats: async () => {
          throw new Error("Stats load failed");
        },
      });
      store = new StatsStore(api);

      await store.loadDashboardStats({
        workspaceId: 1,
        dateFrom: "2025-03-01T00:00:00.000Z",
        dateTo: "2025-03-31T23:59:59.999Z",
      });

      expect(store.dashboardStats).toBeNull();
      expect(store.error).toBe("Stats load failed");
      expect(store.loading).toBe(false);
    });

    it("passes params to API", async () => {
      let receivedParams: DashboardStatsParams | null = null;
      const api = createMockStatsApi({
        getDashboardStats: async (params) => {
          receivedParams = params;
          return {
            balance: 0,
            totalIncome: 0,
            totalExpense: 0,
            expensesByCategory: [],
            incomeByCategory: [],
            expensesByDay: [],
            expensesByMonth: [],
          };
        },
      });
      store = new StatsStore(api);

      await store.loadDashboardStats({
        workspaceId: 42,
        dateFrom: "2025-01-01T00:00:00.000Z",
        dateTo: "2025-01-31T23:59:59.999Z",
      });

      expect(receivedParams).toEqual({
        workspaceId: 42,
        dateFrom: "2025-01-01T00:00:00.000Z",
        dateTo: "2025-01-31T23:59:59.999Z",
      });
    });
  });
});
