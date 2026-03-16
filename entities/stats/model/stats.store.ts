import { makeAutoObservable, runInAction } from "mobx";
import type { DashboardStats } from "@/entities/stats/model/types";
import type { StatsApi } from "@/entities/stats/api/types";
import type { DashboardStatsParams } from "@/entities/stats/api/types";
import { statsLocalStorageApi } from "@/entities/stats/api/local-storage";

export class StatsStore {
  private api: StatsApi;

  dashboardStats: DashboardStats | null = null;
  loading = false;
  error: string | null = null;

  constructor(api: StatsApi = statsLocalStorageApi) {
    this.api = api;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async loadDashboardStats(params: DashboardStatsParams): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const stats = await this.api.getDashboardStats(params);
      runInAction(() => {
        this.dashboardStats = stats;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to load dashboard stats";
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }
}

export const statsStore = new StatsStore();
