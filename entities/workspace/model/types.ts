import type { UserId } from "@/entities/user/model/types";

export type WorkspaceId = number;

export interface IWorkspace {
  id: WorkspaceId;
  name: string;
}

export interface IWorkspaceUser {
  id: number;
  userId: UserId;
  workspaceId: WorkspaceId;
}

