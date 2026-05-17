import { describe, it, expect, beforeEach } from "vitest";
import type {
  IWorkspace,
  WorkspaceId,
  IWorkspaceUser,
} from "@/entities/workspace/model/types";
import type { IWorkspaceApi } from "@/entities/workspace/api/types";
import { WorkspaceStore } from "@/entities/workspace/model/workspace.store";

function createMockWorkspaceApi(
  overrides: Partial<IWorkspaceApi> = {},
): IWorkspaceApi {
  return {
    listWorkspaces: async () => ({ items: [], total: 0 }),
    getActiveWorkspace: async () => null,
    createWorkspace: async (payload) => ({
      id: 1,
      name: payload.name,
    }),
    setActiveWorkspace: async () => {},
    getWorkspaceById: async (id) => (id === 1 ? { id: 1, name: "Test" } : null),
    listWorkspaceUsers: async () => [],
    addUserToWorkspace: async () => ({ id: 1, userId: 1, workspaceId: 1 }),
    removeUserFromWorkspace: async () => {},
    ...overrides,
  };
}

describe("WorkspaceStore", () => {
  let store: WorkspaceStore;

  beforeEach(() => {
    store = new WorkspaceStore(createMockWorkspaceApi());
  });

  describe("initial state", () => {
    it("has empty workspaces and no active workspace", () => {
      expect(store.workspaces).toEqual([]);
      expect(store.activeWorkspace).toBeNull();
      expect(store.hasActiveWorkspace).toBe(false);
    });
  });

  describe("loadWorkspaces", () => {
    it("sets workspaces and activeWorkspace from API", async () => {
      const workspaces: IWorkspace[] = [
        { id: 1, name: "Личный" },
        { id: 2, name: "Семья" },
      ];
      const api = createMockWorkspaceApi({
        getActiveWorkspace: async () => workspaces[0],
      });
      store = new WorkspaceStore(api);

      await store.loadWorkspaces();

      expect(store.activeWorkspace).toEqual(workspaces[0]);
      expect(store.hasActiveWorkspace).toBe(true);
      expect(store.loading).toBe(false);
    });

    it("sets error when API throws", async () => {
      const api = createMockWorkspaceApi({
        getActiveWorkspace: () => {
          return Promise.reject(new Error("Load failed"));
        },
      });
      store = new WorkspaceStore(api);

      await store.loadWorkspaces();

      expect(store.workspaces).toEqual([]);
      console.error(store.error);
      expect(store.error).toBe("Load failed");
      expect(store.loading).toBe(false);
    });
  });

  describe("loadWorkspaceUsers", () => {
    it("sets workspaceUsers from API", async () => {
      const users: IWorkspaceUser[] = [
        { id: 1, userId: 1, workspaceId: 1 },
        { id: 2, userId: 2, workspaceId: 1 },
      ];
      const api = createMockWorkspaceApi({
        listWorkspaceUsers: async () => users,
      });
      store = new WorkspaceStore(api);

      await store.loadWorkspaceUsers(1);

      expect(store.workspaceUsers).toEqual(users);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it("sets error when API throws", async () => {
      const api = createMockWorkspaceApi({
        listWorkspaceUsers: async () => {
          throw new Error("Load users failed");
        },
      });
      store = new WorkspaceStore(api);

      await store.loadWorkspaceUsers(1);

      expect(store.workspaceUsers).toEqual([]);
      expect(store.error).toBe("Load users failed");
      expect(store.loading).toBe(false);
    });
  });

});
