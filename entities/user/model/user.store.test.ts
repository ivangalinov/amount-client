import { describe, it, expect, beforeEach } from "vitest";
import type { IUser, UserId } from "@/entities/user/model/types";
import type { IUserApi } from "@/entities/user/api/types";
import { UserStore } from "@/entities/user/model/user.store";

const mockUser = (partial: Partial<IUser> & Pick<IUser, "id" | "name">): IUser => ({
  email: partial.email ?? "u@test.dev",
  ...partial,
});

function createMockUserApi(
  overrides: Partial<{
    getCurrentUser: IUserApi["getCurrentUser"];
    updateCurrentUser: IUserApi["updateCurrentUser"];
    getUserById: IUserApi["getUserById"];
    login: IUserApi["login"];
    register: IUserApi["register"];
    logout: IUserApi["logout"];
  }> = {},
): IUserApi {
  return {
    getCurrentUser: async () => null,
    updateCurrentUser: async (payload) =>
      mockUser({
        id: 1,
        name: payload.name ?? "Test",
        email: "test@test.dev",
      }),
    getUserById: async () => null,
    login: async () => mockUser({ id: 1, name: "L", email: "l@test.dev" }),
    register: async () => mockUser({ id: 1, name: "R", email: "r@test.dev" }),
    logout: async () => {},
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
      expect(store.sessionChecked).toBe(false);
    });
    it("getAuthorName returns placeholder for unknown id", () => {
      expect(store.getAuthorName(1)).toBe("—");
    });
  });

  describe("loadCurrentUser", () => {
    it("sets currentUser when API returns user", async () => {
      const user = mockUser({ id: 1, name: "Alice", email: "a@test.dev" });
      const api = createMockUserApi({ getCurrentUser: async () => user });
      store = new UserStore(api);

      await store.loadCurrentUser();

      expect(store.currentUser).toEqual(user);
      expect(store.isAuthenticated).toBe(true);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.sessionChecked).toBe(true);
    });

    it("keeps currentUser null when API returns null", async () => {
      await store.loadCurrentUser();

      expect(store.currentUser).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.sessionChecked).toBe(true);
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
      expect(store.sessionChecked).toBe(true);
    });
  });

  describe("updateCurrentUser", () => {
    it("updates currentUser with returned user", async () => {
      const api = createMockUserApi({
        updateCurrentUser: async (payload) =>
          mockUser({
            id: 1,
            name: payload.name ?? "Updated",
            email: "x@test.dev",
          }),
      });
      store = new UserStore(api);

      await store.updateCurrentUser({ name: "Bob" });

      expect(store.currentUser).toEqual(
        mockUser({ id: 1, name: "Bob", email: "x@test.dev" }),
      );
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
      const user = mockUser({ id: 1, name: "Alice", email: "a@test.dev" });
      const api = createMockUserApi({ getCurrentUser: async () => user });
      store = new UserStore(api);
      await store.loadCurrentUser();

      expect(store.getAuthorName(1)).toBe("Alice");
    });

    it("returns name from usersById after loadUserById", async () => {
      const user = mockUser({ id: 2, name: "Bob", email: "b@test.dev" });
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
          return mockUser({ id: 1, name: "Cached", email: "c@test.dev" });
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
