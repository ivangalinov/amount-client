import { describe, it, expect, beforeEach } from "vitest";
import type { IOperation } from "@/entities/operation/model/types";
import type { IOperationApi, IOperationCreatePayload } from "@/entities/operation/api/types";
import { OperationStore } from "@/entities/operation/model/operation.store";

function createMockOperationApi(overrides: Partial<{
  listOperations: IOperationApi["listOperations"];
  createOperation: IOperationApi["createOperation"];
  updateOperation: IOperationApi["updateOperation"];
  deleteOperation: IOperationApi["deleteOperation"];
}> = {}): IOperationApi {
  return {
    listOperations: async () => ({ items: [], total: 0 }),
    getOperationById: async () => null,
    createOperation: async (payload) => ({
      id: 1,
      amount: payload.amount,
      categoryId: payload.categoryId,
      title: payload.title,
      userId: payload.userId,
      workspaceId: payload.workspaceId,
      createdAt: payload.createdAt ?? new Date().toISOString(),
    }),
    updateOperation: async (payload) => ({
      id: payload.id,
      amount: payload.amount ?? 0,
      categoryId: payload.categoryId ?? 1,
      title: payload.title ?? "",
      userId: 1,
      workspaceId: 1,
      createdAt: payload.createdAt ?? new Date().toISOString(),
    }),
    deleteOperation: async () => {},
    ...overrides,
  };
}

describe("OperationStore", () => {
  let store: OperationStore;

  beforeEach(() => {
    store = new OperationStore(createMockOperationApi());
  });

  describe("initial state", () => {
    it("has empty operations and zero balance/totals", () => {
      expect(store.operations).toEqual([]);
      expect(store.balance).toBe(0);
      expect(store.totalIncome).toBe(0);
      expect(store.totalExpense).toBe(0);
    });
  });

  describe("loadOperations", () => {
    it("sets operations from API", async () => {
      const ops: IOperation[] = [
        {
          id: 1,
          amount: -100,
          categoryId: 1,
          title: "Обед",
          userId: 1,
          workspaceId: 1,
          createdAt: new Date().toISOString(),
        },
      ];
      const api = createMockOperationApi({
        listOperations: async () => ({ items: ops, total: 1 }),
      });
      store = new OperationStore(api);

      await store.loadOperations();

      expect(store.operations).toEqual(ops);
      expect(store.balance).toBe(-100);
      expect(store.totalExpense).toBe(-100);
      expect(store.totalIncome).toBe(0);
      expect(store.loading).toBe(false);
    });

    it("sets error when API throws", async () => {
      const api = createMockOperationApi({
        listOperations: async () => {
          throw new Error("Load failed");
        },
      });
      store = new OperationStore(api);

      await store.loadOperations();

      expect(store.operations).toEqual([]);
      expect(store.error).toBe("Load failed");
    });
  });

  describe("balance, totalIncome, totalExpense", () => {
    it("computes correctly with mixed operations", async () => {
      const ops: IOperation[] = [
        {
          id: 1,
          amount: 1000,
          categoryId: 1,
          title: "Зарплата",
          userId: 1,
          workspaceId: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          amount: -300,
          categoryId: 2,
          title: "Еда",
          userId: 1,
          workspaceId: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: 3,
          amount: -200,
          categoryId: 2,
          title: "Транспорт",
          userId: 1,
          workspaceId: 1,
          createdAt: new Date().toISOString(),
        },
      ];
      const api = createMockOperationApi({
        listOperations: async () => ({ items: ops, total: 3 }),
      });
      store = new OperationStore(api);
      await store.loadOperations();

      expect(store.totalIncome).toBe(1000);
      expect(store.totalExpense).toBe(-500);
      expect(store.balance).toBe(500);
    });
  });

  describe("createOperation", () => {
    it("sets error and rethrows when API throws, operations unchanged", async () => {
      const api = createMockOperationApi({
        createOperation: async () => {
          throw new Error("Create failed");
        },
      });
      store = new OperationStore(api);

      await expect(
        store.createOperation({
          amount: -50,
          categoryId: 1,
          title: "Кофе",
          userId: 1,
          workspaceId: 1,
        })
      ).rejects.toThrow("Create failed");

      expect(store.operations).toHaveLength(0);
      expect(store.error).toBe("Create failed");
      expect(store.loading).toBe(false);
    });

    it("appends operation and returns it", async () => {
      const payload: IOperationCreatePayload = {
        amount: -50,
        categoryId: 1,
        title: "Кофе",
        userId: 1,
        workspaceId: 1,
      };
      const api = createMockOperationApi({
        createOperation: async (p) => ({
          id: 1,
          amount: p.amount,
          categoryId: p.categoryId,
          title: p.title,
          userId: p.userId,
          workspaceId: p.workspaceId,
          createdAt: new Date().toISOString(),
        }),
      });
      store = new OperationStore(api);

      const created = await store.createOperation(payload);

      expect(created.title).toBe("Кофе");
      expect(created.amount).toBe(-50);
      expect(store.operations).toHaveLength(1);
      expect(store.balance).toBe(-50);
    });
  });

  describe("updateOperation", () => {
    it("updates existing operation in list", async () => {
      const ops: IOperation[] = [
        {
          id: 1,
          amount: -100,
          categoryId: 1,
          title: "Обед",
          userId: 1,
          workspaceId: 1,
          createdAt: new Date().toISOString(),
        },
      ];
      const api = createMockOperationApi({
        listOperations: async () => ({ items: ops, total: 1 }),
        updateOperation: async (payload) => ({
          id: payload.id,
          amount: payload.amount ?? -100,
          categoryId: payload.categoryId ?? 1,
          title: payload.title ?? "Обед",
          userId: 1,
          workspaceId: 1,
          createdAt: new Date().toISOString(),
        }),
      });
      store = new OperationStore(api);
      await store.loadOperations();

      await store.updateOperation({ id: 1, amount: -150, title: "Обед в кафе" });

      expect(store.operations[0].amount).toBe(-150);
      expect(store.operations[0].title).toBe("Обед в кафе");
      expect(store.balance).toBe(-150);
    });
  });

  describe("deleteOperation", () => {
    it("removes operation from list", async () => {
      const ops: IOperation[] = [
        {
          id: 1,
          amount: -100,
          categoryId: 1,
          title: "Обед",
          userId: 1,
          workspaceId: 1,
          createdAt: new Date().toISOString(),
        },
      ];
      const api = createMockOperationApi({
        listOperations: async () => ({ items: ops, total: 1 }),
        deleteOperation: async () => {},
      });
      store = new OperationStore(api);
      await store.loadOperations();

      await store.deleteOperation(1);

      expect(store.operations).toHaveLength(0);
      expect(store.balance).toBe(0);
    });

    it("sets error and rethrows when API throws, operations unchanged", async () => {
      const ops: IOperation[] = [
        {
          id: 1,
          amount: -100,
          categoryId: 1,
          title: "Обед",
          userId: 1,
          workspaceId: 1,
          createdAt: new Date().toISOString(),
        },
      ];
      const api = createMockOperationApi({
        listOperations: async () => ({ items: ops, total: 1 }),
        deleteOperation: async () => {
          throw new Error("Delete failed");
        },
      });
      store = new OperationStore(api);
      await store.loadOperations();

      await expect(store.deleteOperation(1)).rejects.toThrow("Delete failed");

      expect(store.operations).toHaveLength(1);
      expect(store.error).toBe("Delete failed");
      expect(store.loading).toBe(false);
    });
  });
});
