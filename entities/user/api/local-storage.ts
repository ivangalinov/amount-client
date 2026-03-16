import type { User } from "@/entities/user/model/types";
import type { UserId } from "@/entities/user/model/types";
import type { UserApi } from "@/entities/user/api/types";
import { keyValueStorage } from "@/shared/api/local-storage";

const CURRENT_USER_KEY = "amount:currentUser";
const USERS_KEY = "amount:users";

const DEFAULT_USER_NAME = "Локальный пользователь";

async function readUsers(): Promise<User[]> {
  const raw = await keyValueStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

async function writeUsers(users: User[]): Promise<void> {
  await keyValueStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function ensureDefaultUser(): Promise<User> {
  const users = await readUsers();
  const nextId = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  const defaultUser: User = { id: nextId, name: DEFAULT_USER_NAME };
  users.push(defaultUser);
  await writeUsers(users);
  await keyValueStorage.setItem(CURRENT_USER_KEY, String(defaultUser.id));
  return defaultUser;
}

export const userLocalStorageApi: UserApi = {
  async getCurrentUser(): Promise<User | null> {
    const idRaw = await keyValueStorage.getItem(CURRENT_USER_KEY);
    const users = await readUsers();
    if (!idRaw) {
      if (users.length === 0) return await ensureDefaultUser();
      return null;
    }
    const id = Number(idRaw);
    const found = users.find((u) => u.id === id) ?? null;
    if (!found && users.length === 0) return await ensureDefaultUser();
    return found;
  },

  async updateCurrentUser(payload: { name?: string }): Promise<User> {
    const users = await readUsers();
    let current = await this.getCurrentUser();

    if (!current) {
      // create default user if not exists
      const nextId = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;
      current = { id: nextId, name: payload.name ?? "" };
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

  async getUserById(id: UserId): Promise<User | null> {
    const users = await readUsers();
    return users.find((u) => u.id === id) ?? null;
  },
};

