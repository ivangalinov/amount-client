import { makeAutoObservable, runInAction } from "mobx";
import type { IUser, UserId } from "@/entities/user/model/types";
import type { IUserApi } from "@/entities/user/api/types";
import { userRemoteApi } from "@/entities/user/api/remote";
import { userLocalStorageApi } from "@/entities/user/api/local-storage";

export class UserStore {
  private readonly injectedApi: IUserApi | null;

  currentUser: IUser | null = null;
  /** Cache of users loaded by id (e.g. for operation author names) */
  usersById = new Map<UserId, IUser>();
  loading = false;
  /** After the first `loadCurrentUser` attempt (client session check). */
  sessionChecked = false;
  error: string | null = null;

  constructor(api?: IUserApi) {
    this.injectedApi = api ?? null;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  private resolveApi(): IUserApi {
    if (this.injectedApi) {
      return this.injectedApi;
    }
    return typeof window !== "undefined" ? userRemoteApi : userLocalStorageApi;
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
      const user = await this.resolveApi().getUserById(id);
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
      const user = await this.resolveApi().getCurrentUser();
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
        this.sessionChecked = true;
      });
    }
  }

  async login(email: string, password: string): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const u = await this.resolveApi().login(email, password);
      runInAction(() => {
        this.currentUser = u;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to sign in";
      });
      throw e;
    } finally {
      runInAction(() => {
        this.loading = false;
        this.sessionChecked = true;
      });
    }
  }

  async register(payload: {
    email: string;
    password: string;
    name?: string;
  }): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const u = await this.resolveApi().register(payload);
      runInAction(() => {
        this.currentUser = u;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to register";
      });
      throw e;
    } finally {
      runInAction(() => {
        this.loading = false;
        this.sessionChecked = true;
      });
    }
  }

  async logout(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      await this.resolveApi().logout();
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to sign out";
      });
      throw e;
    } finally {
      runInAction(() => {
        this.currentUser = null;
        this.usersById.clear();
        this.loading = false;
        this.sessionChecked = true;
      });
    }
  }

  async updateCurrentUser(payload: { name?: string }): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const user = await this.resolveApi().updateCurrentUser(payload);
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
