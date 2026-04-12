import type { IUser, UserId } from "@/entities/user/model/types";
import type { IUserApi } from "@/entities/user/api/types";
import { getApiBase } from "@/shared/lib/api-base";
import { parseFastApiError } from "@/shared/lib/fastapi-error";

type MeResponse = {
  id: number;
  name: string;
  email: string;
};

function mapUser(row: MeResponse): IUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
  };
}

async function fetchAuth(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${getApiBase()}/${path}`, {
    ...init,
    credentials: "include",
    headers,
  });
}

export const userRemoteApi: IUserApi = {
  async getCurrentUser(): Promise<IUser | null> {
    if (typeof window === "undefined") {
      return null;
    }
    const res = await fetchAuth("auth/me");
    if (res.status === 401) {
      return null;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(parseFastApiError(text) || `HTTP ${res.status}`);
    }
    const row = (await res.json()) as MeResponse;
    return mapUser(row);
  },

  async login(email: string, password: string): Promise<IUser> {
    const res = await fetchAuth("auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(parseFastApiError(text) || `HTTP ${res.status}`);
    }
    const row = (await res.json()) as MeResponse;
    return mapUser(row);
  },

  async register(payload: {
    email: string;
    password: string;
    name?: string;
  }): Promise<IUser> {
    const res = await fetchAuth("auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(parseFastApiError(text) || `HTTP ${res.status}`);
    }
    const row = (await res.json()) as MeResponse;
    return mapUser(row);
  },

  async logout(): Promise<void> {
    const res = await fetchAuth("auth/logout", { method: "POST" });
    if (!res.ok && res.status !== 204) {
      const text = await res.text();
      throw new Error(parseFastApiError(text) || `HTTP ${res.status}`);
    }
  },

  async updateCurrentUser(_payload: { name?: string }): Promise<IUser> {
    throw new Error("updateCurrentUser is not implemented for remote API");
  },

  async getUserById(_id: UserId): Promise<IUser | null> {
    return null;
  },
};
