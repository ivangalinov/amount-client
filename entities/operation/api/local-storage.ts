import type {
  IOperation,
  OperationId,
} from "@/entities/operation/model/types";
import type {
  IOperationApi,
  IOperationCreatePayload,
  IOperationListParams,
  IOperationUpdatePayload,
} from "@/entities/operation/api/types";
import type { CategoryId } from "@/entities/category/model/types";
import type { WorkspaceId } from "@/entities/workspace/model/types";
import type { UserId } from "@/entities/user/model/types";
import type { IListResult } from "@/shared/api/types";
import { paginateList } from "@/shared/api/paginate";
import { keyValueStorage } from "@/shared/api/local-storage";

const OPERATIONS_KEY = "amount:operations";

async function readOperations(): Promise<IOperation[]> {
  const raw = await keyValueStorage.getItem(OPERATIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as IOperation[];
  } catch {
    return [];
  }
}

async function writeOperations(operations: IOperation[]): Promise<void> {
  await keyValueStorage.setItem(OPERATIONS_KEY, JSON.stringify(operations));
}

function filterOperations(
  operations: IOperation[],
  params?: IOperationListParams,
): IOperation[] {
  if (!params) return operations;
  return operations.filter((o) => {
    if (params.workspaceId != null && o.workspaceId !== params.workspaceId) {
      return false;
    }
    if (params.userId != null && o.userId !== params.userId) {
      return false;
    }
    if (params.categoryId != null && o.categoryId !== params.categoryId) {
      return false;
    }
    if (params.dateFrom != null && o.createdAt < params.dateFrom) {
      return false;
    }
    if (params.dateTo != null && o.createdAt > params.dateTo) {
      return false;
    }
    return true;
  });
}

/** Свежие сверху (по createdAt по убыванию) */
function sortByCreatedDesc(operations: IOperation[]): IOperation[] {
  return [...operations].sort(
    (a, b) => (b.createdAt > a.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : 0)
  );
}

export const operationLocalStorageApi: IOperationApi = {
  async listOperations(
    params?: IOperationListParams,
  ): Promise<IListResult<IOperation>> {
    const all = await readOperations();
    const filtered = filterOperations(all, params);
    const sorted = sortByCreatedDesc(filtered);
    return paginateList(sorted, params);
  },

  async getOperationById(id: OperationId): Promise<IOperation | null> {
    const operations = await readOperations();
    return operations.find((o) => o.id === id) ?? null;
  },

  async createOperation(
    payload: IOperationCreatePayload,
  ): Promise<IOperation> {
    const operations = await readOperations();
    const nextId = operations.length
      ? Math.max(...operations.map((o) => o.id)) + 1
      : 1;

    const createdAt =
      payload.createdAt ?? new Date().toISOString();

    const operation: IOperation = {
      id: nextId,
      amount: payload.amount,
      categoryId: payload.categoryId as CategoryId,
      categoryName: "",
      categoryColor: "",
      title: payload.title,
      userId: (payload.userId ?? 1) as UserId,
      userName: "",
      workspaceId: payload.workspaceId as WorkspaceId,
      createdAt,
    };

    operations.push(operation);
    await writeOperations(operations);
    return operation;
  },

  async updateOperation(
    payload: IOperationUpdatePayload,
  ): Promise<IOperation> {
    const operations = await readOperations();
    const idx = operations.findIndex((o) => o.id === payload.id);
    if (idx === -1) {
      throw new Error("Operation not found");
    }

    const updated: IOperation = {
      ...operations[idx],
      ...payload,
    };

    operations[idx] = updated;
    await writeOperations(operations);
    return updated;
  },

  async deleteOperation(id: OperationId): Promise<void> {
    const operations = await readOperations();
    const next = operations.filter((o) => o.id !== id);
    await writeOperations(next);
  },
};

