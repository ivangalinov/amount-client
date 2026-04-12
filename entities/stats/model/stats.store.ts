import { makeAutoObservable, runInAction } from "mobx";
import type { IDashboardStats } from "@/entities/stats/model/types";
import type { IStatsApi } from "@/entities/stats/api/types";
import type { IDashboardStatsParams } from "@/entities/stats/api/types";
import StatsRemoteApi from "@/entities/stats/api/remote";
import { statsLocalStorageApi } from "@/entities/stats/api/local-storage";

export class StatsStore {
  private readonly injectedApi: IStatsApi | null;

  dashboardStats: IDashboardStats | null = null;
  loading = false;
  error: string | null = null;

  constructor(api?: IStatsApi) {
    this.injectedApi = api ?? null;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  private resolveApi(): IStatsApi {
    if (this.injectedApi) {
      return this.injectedApi;
    }
    return typeof window !== "undefined"
      ? new StatsRemoteApi()
      : statsLocalStorageApi;
  }

  async loadDashboardStats(params: IDashboardStatsParams): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const stats = await this.resolveApi().getDashboardStats(params);
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
