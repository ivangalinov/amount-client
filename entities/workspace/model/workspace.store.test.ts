import { describe, it, expect, beforeEach } from "vitest";
import type {
  Workspace,
  WorkspaceId,
  WorkspaceUser,
} from "@/entities/workspace/model/types";
import type { WorkspaceApi } from "@/entities/workspace/api/types";
import { WorkspaceStore } from "@/entities/workspace/model/workspace.store";

function createMockWorkspaceApi(overrides: Partial<{
  listWorkspaces: WorkspaceApi["listWorkspaces"];
  getActiveWorkspace: WorkspaceApi["getActiveWorkspace"];
  createWorkspace: WorkspaceApi["createWorkspace"];
  setActiveWorkspace: WorkspaceApi["setActiveWorkspace"];
  getWorkspaceById: WorkspaceApi["getWorkspaceById"];
}> = {}): WorkspaceApi {
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
      const workspaces: Workspace[] = [
        { id: 1, name: "Личный" },
        { id: 2, name: "Семья" },
      ];
      const api = createMockWorkspaceApi({
        listWorkspaces: async () => ({ items: workspaces, total: 2 }),
        getActiveWorkspace: async () => workspaces[0],
      });
      store = new WorkspaceStore(api);

      await store.loadWorkspaces();

      expect(store.workspaces).toEqual(workspaces);
      expect(store.activeWorkspace).toEqual(workspaces[0]);
      expect(store.hasActiveWorkspace).toBe(true);
      expect(store.loading).toBe(false);
    });

    it("sets error when API throws", async () => {
      const api = createMockWorkspaceApi({
        listWorkspaces: async () => {
          throw new Error("Load failed");
        },
      });
      store = new WorkspaceStore(api);

      await store.loadWorkspaces();

      expect(store.workspaces).toEqual([]);
      expect(store.error).toBe("Load failed");
      expect(store.loading).toBe(false);
    });
  });

  describe("createWorkspace", () => {
    it("appends new workspace and sets active if none", async () => {
      const api = createMockWorkspaceApi({
        createWorkspace: async (payload) => ({
          id: 1,
          name: payload.name,
        }),
      });
      store = new WorkspaceStore(api);

      const created = await store.createWorkspace("Новый");

      expect(created).toEqual({ id: 1, name: "Новый" });
      expect(store.workspaces).toHaveLength(1);
      expect(store.workspaces[0].name).toBe("Новый");
      expect(store.activeWorkspace).toEqual(created);
    });

    it("keeps existing activeWorkspace when creating second workspace", async () => {
      const existing: Workspace = { id: 1, name: "Личный" };
      const api = createMockWorkspaceApi({
        listWorkspaces: async () => ({ items: [existing], total: 1 }),
        getActiveWorkspace: async () => existing,
        createWorkspace: async (payload) => ({ id: 2, name: payload.name }),
      });
      store = new WorkspaceStore(api);
      await store.loadWorkspaces();

      await store.createWorkspace("Второй");

      expect(store.workspaces).toHaveLength(2);
      expect(store.activeWorkspace?.id).toBe(1);
    });

    it("sets error when API throws and does not mutate workspaces", async () => {
      const api = createMockWorkspaceApi({
        createWorkspace: async () => {
          throw new Error("Create failed");
        },
      });
      store = new WorkspaceStore(api);

      await expect(store.createWorkspace("Новый")).rejects.toThrow(
        "Create failed"
      );

      expect(store.workspaces).toHaveLength(0);
      expect(store.error).toBe("Create failed");
      expect(store.loading).toBe(false);
    });
  });

  describe("setActiveWorkspace", () => {
    it("updates activeWorkspace", async () => {
      const ws: Workspace = { id: 2, name: "Другой" };
      const api = createMockWorkspaceApi({
        setActiveWorkspace: async () => {},
        getWorkspaceById: async (id: WorkspaceId) => (id === 2 ? ws : null),
      });
      store = new WorkspaceStore(api);

      await store.setActiveWorkspace(2);

      expect(store.activeWorkspace).toEqual(ws);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it("sets error when API throws", async () => {
      const api = createMockWorkspaceApi({
        setActiveWorkspace: async () => {
          throw new Error("Set active failed");
        },
        getWorkspaceById: async () => null,
      });
      store = new WorkspaceStore(api);

      await store.setActiveWorkspace(2);

      expect(store.activeWorkspace).toBeNull();
      expect(store.error).toBe("Set active failed");
      expect(store.loading).toBe(false);
    });
  });

  describe("loadWorkspaceUsers", () => {
    it("sets workspaceUsers from API", async () => {
      const users: WorkspaceUser[] = [
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
