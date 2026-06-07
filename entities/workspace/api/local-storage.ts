import type {
  IWorkspace,
  WorkspaceId,
  IWorkspaceUser,
} from "@/entities/workspace/model/types";
import type { IWorkspaceApi } from "@/entities/workspace/api/types";
import type { IUser, UserId } from "@/entities/user/model/types";
import type { IListParams, IListResult } from "@/shared/api/types";
import { paginateList } from "@/shared/api/paginate";
import { keyValueStorage } from "@/shared/api/local-storage";

const WORKSPACES_KEY = "amount:workspaces";
const WORKSPACE_USERS_KEY = "amount:workspaceUsers";
const ACTIVE_WORKSPACE_KEY = "amount:activeWorkspace";
const USERS_KEY = "amount:users";

interface IWorkspaceMembership {
  id: number;
  workspaceId: WorkspaceId;
  userId: UserId;
}

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

async function readMemberships(): Promise<IWorkspaceMembership[]> {
  return (await readJson<IWorkspaceMembership[]>(WORKSPACE_USERS_KEY)) ?? [];
}

async function writeMemberships(items: IWorkspaceMembership[]): Promise<void> {
  await writeJson(WORKSPACE_USERS_KEY, items);
}

async function resolveUserName(userId: UserId): Promise<string> {
  const users = (await readJson<IUser[]>(USERS_KEY)) ?? [];
  return users.find((u) => u.id === userId)?.name ?? `User ${userId}`;
}

async function membershipToWorkspaceUser(
  membership: IWorkspaceMembership,
): Promise<IWorkspaceUser> {
  return {
    id: membership.id,
    name: await resolveUserName(membership.userId),
  };
}

async function readWorkspaces(): Promise<IWorkspace[]> {
  return (await readJson<IWorkspace[]>(WORKSPACES_KEY)) ?? [];
}

async function writeWorkspaces(items: IWorkspace[]): Promise<void> {
  await writeJson(WORKSPACES_KEY, items);
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
      const memberships = await readMemberships();
      const nextWuId = memberships.length
        ? Math.max(...memberships.map((wu) => wu.id)) + 1
        : 1;
      memberships.push({
        id: nextWuId,
        workspaceId: workspace.id,
        userId,
      });
      await writeMemberships(memberships);
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
    return paginateList(workspaces, params);
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
    const memberships = await readMemberships();
    const inWorkspace = memberships.filter(
      (m) => m.workspaceId === workspaceId,
    );
    return Promise.all(inWorkspace.map(membershipToWorkspaceUser));
  },

  async addUserToWorkspace(payload: {
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<IWorkspaceUser> {
    const memberships = await readMemberships();
    const nextId = memberships.length
      ? Math.max(...memberships.map((w) => w.id)) + 1
      : 1;

    const record: IWorkspaceMembership = {
      id: nextId,
      workspaceId: payload.workspaceId,
      userId: payload.userId,
    };

    memberships.push(record);
    await writeMemberships(memberships);
    return membershipToWorkspaceUser(record);
  },

  async removeUserFromWorkspace(id: number): Promise<void> {
    const memberships = await readMemberships();
    const next = memberships.filter((w) => w.id !== id);
    await writeMemberships(next);
  },
};

