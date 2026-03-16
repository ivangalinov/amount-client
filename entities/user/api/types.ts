import type { User, UserId } from "@/entities/user/model/types";
import type { ListParams, ListResult } from "@/shared/api/types";

export interface UserApi {
  getCurrentUser(): Promise<User | null>;
  updateCurrentUser(payload: { name?: string }): Promise<User>;
  getUserById(id: UserId): Promise<User | null>;
}

