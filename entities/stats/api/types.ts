import type { IDashboardStats } from "@/entities/stats/model/types";
import type { WorkspaceId } from "@/entities/workspace/model/types";

export interface IDashboardStatsParams {
  workspaceId: WorkspaceId;
  dateFrom: string;
  dateTo: string;
}

export interface IStatsApi {
  getDashboardStats(params: IDashboardStatsParams): Promise<IDashboardStats>;
}
