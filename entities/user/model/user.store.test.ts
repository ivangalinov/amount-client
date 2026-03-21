import { describe, it, expect, beforeEach } from "vitest";
import type { IUser, UserId } from "@/entities/user/model/types";
import type { IUserApi } from "@/entities/user/api/types";
import { UserStore } from "@/entities/user/model/user.store";

function createMockUserApi(overrides: Partial<{
  getCurrentUser: IUserApi["getCurrentUser"];
  updateCurrentUser: IUserApi["updateCurrentUser"];
  getUserById: IUserApi["getUserById"];
}> = {}): IUserApi {
  return {
    getCurrentUser: async () => null,
    updateCurrentUser: async (payload) => ({
      id: 1,
      name: payload.name ?? "Test",
    }),
    getUserById: async () => null,
    ...overrides,
  };
}

describe("UserStore", () => {
  let store: UserStore;

  beforeEach(() => {
    store = new UserStore(createMockUserApi());
  });

  describe("initial state", () => {
    it("has null currentUser and is not authenticated", () => {
      expect(store.currentUser).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
    it("getAuthorName returns placeholder for unknown id", () => {
      expect(store.getAuthorName(1)).toBe("—");
    });
  });

  describe("loadCurrentUser", () => {
    it("sets currentUser when API returns user", async () => {
      const user: IUser = { id: 1, name: "Alice" };
      const api = createMockUserApi({ getCurrentUser: async () => user });
      store = new UserStore(api);

      await store.loadCurrentUser();

      expect(store.currentUser).toEqual(user);
      expect(store.isAuthenticated).toBe(true);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it("keeps currentUser null when API returns null", async () => {
      await store.loadCurrentUser();

      expect(store.currentUser).toBeNull();
      expect(store.loading).toBe(false);
    });

    it("sets error when API throws", async () => {
      const api = createMockUserApi({
        getCurrentUser: async () => {
          throw new Error("Network error");
        },
      });
      store = new UserStore(api);

      await store.loadCurrentUser();

      expect(store.currentUser).toBeNull();
      expect(store.error).toBe("Network error");
      expect(store.loading).toBe(false);
    });
  });

  describe("updateCurrentUser", () => {
    it("updates currentUser with returned user", async () => {
      const api = createMockUserApi({
        updateCurrentUser: async (payload) => ({
          id: 1,
          name: payload.name ?? "Updated",
        }),
      });
      store = new UserStore(api);

      await store.updateCurrentUser({ name: "Bob" });

      expect(store.currentUser).toEqual({ id: 1, name: "Bob" });
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it("sets error when API throws and does not rethrow", async () => {
      const api = createMockUserApi({
        updateCurrentUser: async () => {
          throw new Error("Update failed");
        },
      });
      store = new UserStore(api);

      await store.updateCurrentUser({ name: "Bob" });

      expect(store.currentUser).toBeNull();
      expect(store.error).toBe("Update failed");
      expect(store.loading).toBe(false);
    });
  });

  describe("getAuthorName and loadUserById", () => {
    it("returns currentUser name when id matches", async () => {
      const user: IUser = { id: 1, name: "Alice" };
      const api = createMockUserApi({ getCurrentUser: async () => user });
      store = new UserStore(api);
      await store.loadCurrentUser();

      expect(store.getAuthorName(1)).toBe("Alice");
    });

    it("returns name from usersById after loadUserById", async () => {
      const user: IUser = { id: 2, name: "Bob" };
      const api = createMockUserApi({
        getUserById: async (id: UserId) => (id === 2 ? user : null),
      });
      store = new UserStore(api);

      await store.loadUserById(2);

      expect(store.getAuthorName(2)).toBe("Bob");
    });

    it("does not refetch when user already in cache", async () => {
      let callCount = 0;
      const api = createMockUserApi({
        getUserById: async () => {
          callCount++;
          return { id: 1, name: "Cached" };
        },
      });
      store = new UserStore(api);

      await store.loadUserById(1);
      await store.loadUserById(1);

      expect(callCount).toBe(1);
      expect(store.getAuthorName(1)).toBe("Cached");
    });

    it("getAuthorName returns placeholder when getUserById returns null", async () => {
      const api = createMockUserApi({
        getUserById: async () => null,
      });
      store = new UserStore(api);

      await store.loadUserById(99);

      expect(store.getAuthorName(99)).toBe("—");
    });
  });
});
