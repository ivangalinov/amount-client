import type { IUser, UserId } from "@/entities/user/model/types";

export interface IUserApi {
  getCurrentUser(): Promise<IUser | null>;
  updateCurrentUser(payload: { name?: string }): Promise<IUser>;
  getUserById(id: UserId): Promise<IUser | null>;
  login(email: string, password: string): Promise<IUser>;
  register(payload: {
    email: string;
    password: string;
    name?: string;
  }): Promise<IUser>;
  logout(): Promise<void>;
}
