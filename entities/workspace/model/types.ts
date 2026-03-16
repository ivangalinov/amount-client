import type { UserId } from "@/entities/user/model/types";

export type WorkspaceId = number;

export interface Workspace {
  id: WorkspaceId;
  name: string;
}

export interface WorkspaceUser {
  id: number;
  userId: UserId;
  workspaceId: WorkspaceId;
}

