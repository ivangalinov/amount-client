import { makeAutoObservable, runInAction } from "mobx";
import type {
  Workspace,
  WorkspaceId,
  WorkspaceUser,
} from "@/entities/workspace/model/types";
import type { UserId } from "@/entities/user/model/types";
import type { WorkspaceApi } from "@/entities/workspace/api/types";
import { workspaceLocalStorageApi } from "@/entities/workspace/api/local-storage";
import type { ListResult } from "@/shared/api/types";

export class WorkspaceStore {
  private api: WorkspaceApi;

  workspaces: Workspace[] = [];
  activeWorkspace: Workspace | null = null;
  workspaceUsers: WorkspaceUser[] = [];

  loading = false;
  error: string | null = null;

  constructor(api: WorkspaceApi = workspaceLocalStorageApi) {
    this.api = api;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get hasActiveWorkspace(): boolean {
    return this.activeWorkspace != null;
  }

  async loadWorkspaces(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const result: ListResult<Workspace> = await this.api.listWorkspaces();
      const active = await this.api.getActiveWorkspace();
      runInAction(() => {
        this.workspaces = result.items;
        this.activeWorkspace = active;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to load workspaces";
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async createWorkspace(name: string): Promise<Workspace> {
    this.loading = true;
    this.error = null;
    try {
      const workspace = await this.api.createWorkspace({ name });
      runInAction(() => {
        this.workspaces.push(workspace);
        if (!this.activeWorkspace) {
          this.activeWorkspace = workspace;
        }
      });
      return workspace;
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to create workspace";
      });
      throw e;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async setActiveWorkspace(id: WorkspaceId): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      await this.api.setActiveWorkspace(id);
      const workspace = await this.api.getWorkspaceById(id);
      runInAction(() => {
        this.activeWorkspace = workspace;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to set active workspace";
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async loadWorkspaceUsers(workspaceId: WorkspaceId): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const users = await this.api.listWorkspaceUsers(workspaceId);
      runInAction(() => {
        this.workspaceUsers = users;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to load workspace users";
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async addUserToWorkspace(payload: {
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<WorkspaceUser> {
    const wu = await this.api.addUserToWorkspace(payload);
    runInAction(() => {
      if (wu.workspaceId === this.activeWorkspace?.id) {
        this.workspaceUsers.push(wu);
      }
    });
    return wu;
  }
}

export const workspaceStore = new WorkspaceStore();

