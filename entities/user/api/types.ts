import type { IUser, UserId } from "@/entities/user/model/types";
import type { IListParams, IListResult } from "@/shared/api/types";

export interface IUserApi {
  getCurrentUser(): Promise<IUser | null>;
  updateCurrentUser(payload: { name?: string }): Promise<IUser>;
  getUserById(id: UserId): Promise<IUser | null>;
}

