import { makeAutoObservable, runInAction } from "mobx";
import type {
  IWorkspace,
  WorkspaceId,
  IWorkspaceUser,
} from "@/entities/workspace/model/types";
import type { IWorkspaceApi } from "@/entities/workspace/api/types";
import RemoteAPI from "@/entities/workspace/api/remote";

export class WorkspaceStore {
  private api: IWorkspaceApi;

  workspaces: IWorkspace[] = [];
  activeWorkspace: IWorkspace | null = null;
  workspaceUsers: IWorkspaceUser[] = [];

  loading = false;
  error: string | null = null;

  constructor(api: IWorkspaceApi = new RemoteAPI()) {
    this.api = api;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get hasActiveWorkspace(): boolean {
    return this.activeWorkspace != null;
  }

  async loadWorkspaces(): Promise<void> {
    if (this.activeWorkspace) {
      return;
    }
    this.loading = true;
    this.error = null;
    try {
      const active = await this.api.getActiveWorkspace();
      runInAction(() => {
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
}

export const workspaceStore = new WorkspaceStore();

