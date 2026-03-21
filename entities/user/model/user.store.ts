import { makeAutoObservable, runInAction } from "mobx";
import type { IUser, UserId } from "@/entities/user/model/types";
import type { IUserApi } from "@/entities/user/api/types";
import { userLocalStorageApi } from "@/entities/user/api/local-storage";

export class UserStore {
  private api: IUserApi;

  currentUser: IUser | null = null;
  /** Cache of users loaded by id (e.g. for operation author names) */
  usersById = new Map<UserId, IUser>();
  loading = false;
  error: string | null = null;

  constructor(api: IUserApi = userLocalStorageApi) {
    this.api = api;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isAuthenticated(): boolean {
    return this.currentUser != null;
  }

  getAuthorName(userId: UserId): string {
    const cached = this.usersById.get(userId);
    if (cached) return cached.name;
    if (this.currentUser?.id === userId) return this.currentUser.name;
    return "—";
  }

  async loadUserById(id: UserId): Promise<void> {
    if (this.usersById.has(id)) return;
    try {
      const user = await this.api.getUserById(id);
      runInAction(() => {
        if (user) this.usersById.set(id, user);
      });
    } catch {
      // ignore single user load errors
    }
  }

  async loadCurrentUser(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const user = await this.api.getCurrentUser();
      runInAction(() => {
        this.currentUser = user;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to load current user";
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async updateCurrentUser(payload: { name?: string }): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const user = await this.api.updateCurrentUser(payload);
      runInAction(() => {
        this.currentUser = user;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to update current user";
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }
}

export const userStore = new UserStore();

