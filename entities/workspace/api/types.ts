import type {
  Workspace,
  WorkspaceId,
  WorkspaceUser,
} from "@/entities/workspace/model/types";
import type { UserId } from "@/entities/user/model/types";
import type { ListParams, ListResult } from "@/shared/api/types";

export interface WorkspaceApi {
  listWorkspaces(params?: ListParams): Promise<ListResult<Workspace>>;
  createWorkspace(payload: { name: string }): Promise<Workspace>;
  getWorkspaceById(id: WorkspaceId): Promise<Workspace | null>;
  getActiveWorkspace(): Promise<Workspace | null>;
  setActiveWorkspace(workspaceId: WorkspaceId): Promise<void>;
  listWorkspaceUsers(workspaceId: WorkspaceId): Promise<WorkspaceUser[]>;
  addUserToWorkspace(payload: {
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<WorkspaceUser>;
  removeUserFromWorkspace(id: number): Promise<void>;
}

