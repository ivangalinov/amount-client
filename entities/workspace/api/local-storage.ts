import type {
  IWorkspace,
  WorkspaceId,
  IWorkspaceUser,
} from "@/entities/workspace/model/types";
import type { IWorkspaceApi } from "@/entities/workspace/api/types";
import type { UserId } from "@/entities/user/model/types";
import type { IListParams, IListResult } from "@/shared/api/types";
import { keyValueStorage } from "@/shared/api/local-storage";

const WORKSPACES_KEY = "amount:workspaces";
const WORKSPACE_USERS_KEY = "amount:workspaceUsers";
const ACTIVE_WORKSPACE_KEY = "amount:activeWorkspace";

const DEFAULT_WORKSPACE_NAME = "Личный";

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await keyValueStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await keyValueStorage.setItem(key, JSON.stringify(value));
}

function paginate<T>(items: T[], params?: IListParams): IListResult<T> {
  const { limit, offset } = params ?? {};
  if (limit == null && offset == null) {
    return { items, total: items.length };
  }
  const start = offset ?? 0;
  const end = limit != null ? start + limit : undefined;
  return {
    items: items.slice(start, end),
    total: items.length,
  };
}

async function readWorkspaces(): Promise<IWorkspace[]> {
  return (await readJson<IWorkspace[]>(WORKSPACES_KEY)) ?? [];
}

async function writeWorkspaces(items: IWorkspace[]): Promise<void> {
  await writeJson(WORKSPACES_KEY, items);
}

async function readWorkspaceUsers(): Promise<IWorkspaceUser[]> {
  return (await readJson<IWorkspaceUser[]>(WORKSPACE_USERS_KEY)) ?? [];
}

async function writeWorkspaceUsers(items: IWorkspaceUser[]): Promise<void> {
  await writeJson(WORKSPACE_USERS_KEY, items);
}

const CURRENT_USER_KEY = "amount:currentUser";

async function ensureDefaultWorkspace(): Promise<IWorkspace> {
  const workspaces = await readWorkspaces();
  const nextId = workspaces.length
    ? Math.max(...workspaces.map((w) => w.id)) + 1
    : 1;
  const workspace: IWorkspace = {
    id: nextId,
    name: DEFAULT_WORKSPACE_NAME,
  };
  workspaces.push(workspace);
  await writeWorkspaces(workspaces);
  await keyValueStorage.setItem(ACTIVE_WORKSPACE_KEY, String(workspace.id));

  const currentUserIdRaw = await keyValueStorage.getItem(CURRENT_USER_KEY);
  if (currentUserIdRaw) {
    const userId = Number(currentUserIdRaw);
    if (Number.isFinite(userId)) {
      const wsUsers = await readWorkspaceUsers();
      const nextWuId = wsUsers.length
        ? Math.max(...wsUsers.map((wu) => wu.id)) + 1
        : 1;
      wsUsers.push({
        id: nextWuId,
        workspaceId: workspace.id,
        userId,
      });
      await writeWorkspaceUsers(wsUsers);
    }
  }

  return workspace;
}

export const workspaceLocalStorageApi: IWorkspaceApi = {
  async listWorkspaces(params?: IListParams): Promise<IListResult<IWorkspace>> {
    let workspaces = await readWorkspaces();
    if (workspaces.length === 0) {
      await ensureDefaultWorkspace();
      workspaces = await readWorkspaces();
    }
    return paginate(workspaces, params);
  },

  async createWorkspace(payload: { name: string }): Promise<IWorkspace> {
    const workspaces = await readWorkspaces();
    const nextId = workspaces.length
      ? Math.max(...workspaces.map((w) => w.id)) + 1
      : 1;
    const workspace: IWorkspace = {
      id: nextId,
      name: payload.name,
    };
    workspaces.push(workspace);
    await writeWorkspaces(workspaces);

    // If no active workspace set yet, set this one
    const activeRaw = await keyValueStorage.getItem(ACTIVE_WORKSPACE_KEY);
    if (!activeRaw) {
      await keyValueStorage.setItem(ACTIVE_WORKSPACE_KEY, String(workspace.id));
    }

    return workspace;
  },

  async getWorkspaceById(id: WorkspaceId): Promise<IWorkspace | null> {
    const workspaces = await readWorkspaces();
    return workspaces.find((w) => w.id === id) ?? null;
  },

  async getActiveWorkspace(): Promise<IWorkspace | null> {
    const raw = await keyValueStorage.getItem(ACTIVE_WORKSPACE_KEY);
    let workspaces = await readWorkspaces();
    if (workspaces.length === 0) {
      return await ensureDefaultWorkspace();
    }
    if (!raw) {
      await keyValueStorage.setItem(ACTIVE_WORKSPACE_KEY, String(workspaces[0].id));
      return workspaces[0];
    }
    const id = Number(raw);
    const found = workspaces.find((w) => w.id === id) ?? workspaces[0];
    if (!workspaces.find((w) => w.id === id)) {
      await keyValueStorage.setItem(ACTIVE_WORKSPACE_KEY, String(found.id));
    }
    return found;
  },

  async setActiveWorkspace(workspaceId: WorkspaceId): Promise<void> {
    await keyValueStorage.setItem(ACTIVE_WORKSPACE_KEY, String(workspaceId));
  },

  async listWorkspaceUsers(workspaceId: WorkspaceId): Promise<IWorkspaceUser[]> {
    const wsUsers = await readWorkspaceUsers();
    return wsUsers.filter((wu) => wu.workspaceId === workspaceId);
  },

  async addUserToWorkspace(payload: {
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<IWorkspaceUser> {
    const wsUsers = await readWorkspaceUsers();
    const nextId = wsUsers.length
      ? Math.max(...wsUsers.map((w) => w.id)) + 1
      : 1;

    const record: IWorkspaceUser = {
      id: nextId,
      workspaceId: payload.workspaceId,
      userId: payload.userId,
    };

    wsUsers.push(record);
    await writeWorkspaceUsers(wsUsers);
    return record;
  },

  async removeUserFromWorkspace(id: number): Promise<void> {
    const wsUsers = await readWorkspaceUsers();
    const next = wsUsers.filter((w) => w.id !== id);
    await writeWorkspaceUsers(next);
  },
};

