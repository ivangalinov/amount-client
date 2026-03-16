import type { DashboardStats } from "@/entities/stats/model/types";
import type { WorkspaceId } from "@/entities/workspace/model/types";

export interface DashboardStatsParams {
  workspaceId: WorkspaceId;
  dateFrom: string;
  dateTo: string;
}

export interface StatsApi {
  getDashboardStats(params: DashboardStatsParams): Promise<DashboardStats>;
}
