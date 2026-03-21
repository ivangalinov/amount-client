import type {
  IWorkspace,
  WorkspaceId,
  IWorkspaceUser,
} from "@/entities/workspace/model/types";
import type { UserId } from "@/entities/user/model/types";
import type { IListParams, IListResult } from "@/shared/api/types";

export interface IWorkspaceApi {
  listWorkspaces(params?: IListParams): Promise<IListResult<IWorkspace>>;
  createWorkspace(payload: { name: string }): Promise<IWorkspace>;
  getWorkspaceById(id: WorkspaceId): Promise<IWorkspace | null>;
  getActiveWorkspace(): Promise<IWorkspace | null>;
  setActiveWorkspace(workspaceId: WorkspaceId): Promise<void>;
  listWorkspaceUsers(workspaceId: WorkspaceId): Promise<IWorkspaceUser[]>;
  addUserToWorkspace(payload: {
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<IWorkspaceUser>;
  removeUserFromWorkspace(id: number): Promise<void>;
}

