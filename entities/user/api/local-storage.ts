import type { IUser } from "@/entities/user/model/types";
import type { UserId } from "@/entities/user/model/types";
import type { IUserApi } from "@/entities/user/api/types";
import { keyValueStorage } from "@/shared/api/local-storage";

const CURRENT_USER_KEY = "amount:currentUser";
const USERS_KEY = "amount:users";

const DEFAULT_USER_NAME = "Локальный пользователь";
const DEFAULT_EMAIL = "local@amount.local";

async function readUsers(): Promise<IUser[]> {
  const raw = await keyValueStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown[];
    return parsed.map((row) => {
      const o = row as Record<string, unknown>;
      return {
        id: Number(o.id),
        name: String(o.name ?? ""),
        email: String(o.email ?? DEFAULT_EMAIL),
      };
    });
  } catch {
    return [];
  }
}

async function writeUsers(users: IUser[]): Promise<void> {
  await keyValueStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function ensureDefaultUser(): Promise<IUser> {
  const users = await readUsers();
  const nextId = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  const defaultUser: IUser = {
    id: nextId,
    name: DEFAULT_USER_NAME,
    email: DEFAULT_EMAIL,
  };
  users.push(defaultUser);
  await writeUsers(users);
  await keyValueStorage.setItem(CURRENT_USER_KEY, String(defaultUser.id));
  return defaultUser;
}

export const userLocalStorageApi: IUserApi = {
  async getCurrentUser(): Promise<IUser | null> {
    const idRaw = await keyValueStorage.getItem(CURRENT_USER_KEY);
    const users = await readUsers();
    if (!idRaw) {
      if (users.length === 0) return await ensureDefaultUser();
      return null;
    }
    const id = Number(idRaw);
    const found = users.find((u) => u.id === id) ?? null;
    if (!found && users.length === 0) return await ensureDefaultUser();
    if (found && !found.email) {
      const patched = { ...found, email: DEFAULT_EMAIL };
      const idx = users.findIndex((u) => u.id === found.id);
      if (idx !== -1) users[idx] = patched;
      await writeUsers(users);
      return patched;
    }
    return found;
  },

  async updateCurrentUser(payload: { name?: string }): Promise<IUser> {
    const users = await readUsers();
    let current = await this.getCurrentUser();

    if (!current) {
      const nextId = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;
      current = {
        id: nextId,
        name: payload.name ?? "",
        email: DEFAULT_EMAIL,
      };
      users.push(current);
      await keyValueStorage.setItem(CURRENT_USER_KEY, String(current.id));
    } else {
      current = { ...current, ...payload };
      const idx = users.findIndex((u) => u.id === current!.id);
      if (idx !== -1) {
        users[idx] = current;
      } else {
        users.push(current);
      }
    }

    await writeUsers(users);
    return current;
  },

  async getUserById(id: UserId): Promise<IUser | null> {
    const users = await readUsers();
    return users.find((u) => u.id === id) ?? null;
  },

  async login(email: string, _password: string): Promise<IUser> {
    const users = await readUsers();
    const normalized = email.trim().toLowerCase();
    let u = users.find((x) => x.email.toLowerCase() === normalized);
    if (!u) {
      const nextId = users.length ? Math.max(...users.map((x) => x.id)) + 1 : 1;
      u = {
        id: nextId,
        name: normalized.split("@")[0] || "User",
        email: normalized || DEFAULT_EMAIL,
      };
      users.push(u);
      await writeUsers(users);
    }
    await keyValueStorage.setItem(CURRENT_USER_KEY, String(u.id));
    return u;
  },

  async register(payload: {
    email: string;
    password: string;
    name?: string;
  }): Promise<IUser> {
    const users = await readUsers();
    const normalized = payload.email.trim().toLowerCase();
    if (users.some((x) => x.email.toLowerCase() === normalized)) {
      throw new Error("Email already registered");
    }
    const nextId = users.length ? Math.max(...users.map((x) => x.id)) + 1 : 1;
    const u: IUser = {
      id: nextId,
      name: (payload.name ?? "").trim() || normalized.split("@")[0] || "User",
      email: normalized,
    };
    users.push(u);
    await writeUsers(users);
    await keyValueStorage.setItem(CURRENT_USER_KEY, String(u.id));
    return u;
  },

  async logout(): Promise<void> {
    await keyValueStorage.removeItem(CURRENT_USER_KEY);
  },
};
