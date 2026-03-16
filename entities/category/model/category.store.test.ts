import { describe, it, expect, beforeEach } from "vitest";
import type { Category, CategoryId } from "@/entities/category/model/types";
import { CategoryType } from "@/entities/category/model/types";
import type { CategoryApi } from "@/entities/category/api/types";
import { CategoryStore } from "@/entities/category/model/category.store";

function createMockCategoryApi(overrides: Partial<{
  listCategories: CategoryApi["listCategories"];
  createCategory: CategoryApi["createCategory"];
  updateCategory: CategoryApi["updateCategory"];
  deleteCategory: CategoryApi["deleteCategory"];
}> = {}): CategoryApi {
  return {
    listCategories: async () => ({ items: [], total: 0 }),
    getCategoryById: async () => null,
    createCategory: async (payload) => ({
      id: 1,
      name: payload.name,
      workspaceId: payload.workspaceId,
      type: payload.type,
      userId: payload.userId,
      color: payload.color ?? "#000",
    }),
    updateCategory: async (payload) => ({
      id: payload.id,
      name: payload.name ?? "Updated",
      workspaceId: 1,
      type: CategoryType.Expense,
      userId: 1,
      color: "#000",
    }),
    deleteCategory: async () => {},
    ...overrides,
  };
}

describe("CategoryStore", () => {
  let store: CategoryStore;

  beforeEach(() => {
    store = new CategoryStore(createMockCategoryApi());
  });

  describe("initial state", () => {
    it("has empty categories", () => {
      expect(store.categories).toEqual([]);
      expect(store.categoriesById.size).toBe(0);
    });
    it("getCategoriesByType returns empty array", () => {
      expect(store.getCategoriesByType(CategoryType.Expense)).toEqual([]);
    });
  });

  describe("loadCategories", () => {
    it("sets categories from API", async () => {
      const categories: Category[] = [
        {
          id: 1,
          name: "Еда",
          workspaceId: 1,
          type: CategoryType.Expense,
          userId: 1,
          color: "#f00",
        },
      ];
      const api = createMockCategoryApi({
        listCategories: async () => ({ items: categories, total: 1 }),
      });
      store = new CategoryStore(api);

      await store.loadCategories();

      expect(store.categories).toEqual(categories);
      expect(store.categoriesById.get(1)).toEqual(categories[0]);
      expect(store.loading).toBe(false);
    });

    it("sets error when API throws", async () => {
      const api = createMockCategoryApi({
        listCategories: async () => {
          throw new Error("Load failed");
        },
      });
      store = new CategoryStore(api);

      await store.loadCategories();

      expect(store.categories).toEqual([]);
      expect(store.error).toBe("Load failed");
    });
  });

  describe("createCategory", () => {
    it("sets error and rethrows when API throws, categories unchanged", async () => {
      const api = createMockCategoryApi({
        createCategory: async () => {
          throw new Error("Create failed");
        },
      });
      store = new CategoryStore(api);

      await expect(
        store.createCategory({
          name: "Транспорт",
          workspaceId: 1,
          type: CategoryType.Expense,
          userId: 1,
        })
      ).rejects.toThrow("Create failed");

      expect(store.categories).toHaveLength(0);
      expect(store.error).toBe("Create failed");
      expect(store.loading).toBe(false);
    });

    it("appends category and returns it", async () => {
      const api = createMockCategoryApi({
        createCategory: async (payload) => ({
          id: 1,
          name: payload.name,
          workspaceId: payload.workspaceId,
          type: payload.type,
          userId: payload.userId,
          color: payload.color ?? "#6366f1",
        }),
      });
      store = new CategoryStore(api);

      const created = await store.createCategory({
        name: "Транспорт",
        workspaceId: 1,
        type: CategoryType.Expense,
        userId: 1,
      });

      expect(created.name).toBe("Транспорт");
      expect(store.categories).toHaveLength(1);
      expect(store.categories[0].name).toBe("Транспорт");
    });
  });

  describe("updateCategory", () => {
    it("updates existing category in list", async () => {
      const initial: Category[] = [
        {
          id: 1,
          name: "Еда",
          workspaceId: 1,
          type: CategoryType.Expense,
          userId: 1,
          color: "#f00",
        },
      ];
      const api = createMockCategoryApi({
        listCategories: async () => ({ items: initial, total: 1 }),
        updateCategory: async (payload) => ({
          ...initial[0],
          id: payload.id,
          name: payload.name ?? initial[0].name,
        }),
      });
      store = new CategoryStore(api);
      await store.loadCategories();

      await store.updateCategory({ id: 1, name: "Продукты" });

      expect(store.categories[0].name).toBe("Продукты");
    });

    it("sets error and rethrows when API throws, list unchanged", async () => {
      const initial: Category[] = [
        {
          id: 1,
          name: "Еда",
          workspaceId: 1,
          type: CategoryType.Expense,
          userId: 1,
          color: "#f00",
        },
      ];
      const api = createMockCategoryApi({
        listCategories: async () => ({ items: initial, total: 1 }),
        updateCategory: async () => {
          throw new Error("Update failed");
        },
      });
      store = new CategoryStore(api);
      await store.loadCategories();

      await expect(store.updateCategory({ id: 1, name: "X" })).rejects.toThrow(
        "Update failed"
      );

      expect(store.categories[0].name).toBe("Еда");
      expect(store.error).toBe("Update failed");
      expect(store.loading).toBe(false);
    });
  });

  describe("deleteCategory", () => {
    it("removes category from list", async () => {
      const initial: Category[] = [
        {
          id: 1,
          name: "Еда",
          workspaceId: 1,
          type: CategoryType.Expense,
          userId: 1,
          color: "#f00",
        },
      ];
      const api = createMockCategoryApi({
        listCategories: async () => ({ items: initial, total: 1 }),
        deleteCategory: async () => {},
      });
      store = new CategoryStore(api);
      await store.loadCategories();

      await store.deleteCategory(1);

      expect(store.categories).toHaveLength(0);
    });

    it("sets error and rethrows when API throws, list unchanged", async () => {
      const initial: Category[] = [
        {
          id: 1,
          name: "Еда",
          workspaceId: 1,
          type: CategoryType.Expense,
          userId: 1,
          color: "#f00",
        },
      ];
      const api = createMockCategoryApi({
        listCategories: async () => ({ items: initial, total: 1 }),
        deleteCategory: async () => {
          throw new Error("Delete failed");
        },
      });
      store = new CategoryStore(api);
      await store.loadCategories();

      await expect(store.deleteCategory(1)).rejects.toThrow("Delete failed");

      expect(store.categories).toHaveLength(1);
      expect(store.error).toBe("Delete failed");
      expect(store.loading).toBe(false);
    });
  });

  describe("getCategoriesByType", () => {
    it("filters categories by type", async () => {
      const categories: Category[] = [
        {
          id: 1,
          name: "Еда",
          workspaceId: 1,
          type: CategoryType.Expense,
          userId: 1,
          color: "#f00",
        },
        {
          id: 2,
          name: "Зарплата",
          workspaceId: 1,
          type: CategoryType.Income,
          userId: 1,
          color: "#0f0",
        },
      ];
      const api = createMockCategoryApi({
        listCategories: async () => ({ items: categories, total: 2 }),
      });
      store = new CategoryStore(api);
      await store.loadCategories();

      expect(store.getCategoriesByType(CategoryType.Expense)).toHaveLength(1);
      expect(store.getCategoriesByType(CategoryType.Expense)[0].name).toBe("Еда");
      expect(store.getCategoriesByType(CategoryType.Income)).toHaveLength(1);
      expect(store.getCategoriesByType(CategoryType.Income)[0].name).toBe("Зарплата");
    });
  });
});
