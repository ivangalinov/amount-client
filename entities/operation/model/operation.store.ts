import { makeAutoObservable, runInAction } from "mobx";
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
import { operationLocalStorageApi } from "@/entities/operation/api/local-storage";
import type { IListResult } from "@/shared/api/types";

export class OperationStore {
  private api: IOperationApi;

  operations: IOperation[] = [];
  loading = false;
  error: string | null = null;

  constructor(api: IOperationApi = operationLocalStorageApi) {
    this.api = api;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get totalIncome(): number {
    return this.operations
      .filter((o) => o.amount > 0)
      .reduce((sum, o) => sum + o.amount, 0);
  }

  get totalExpense(): number {
    return this.operations
      .filter((o) => o.amount < 0)
      .reduce((sum, o) => sum + o.amount, 0);
  }

  get balance(): number {
    return this.operations.reduce((sum, o) => sum + o.amount, 0);
  }

  async loadOperations(params?: IOperationListParams): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const result: IListResult<IOperation> =
        await this.api.listOperations(params);
      runInAction(() => {
        this.operations = result.items;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to load operations";
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async createOperation(
    payload: IOperationCreatePayload,
  ): Promise<IOperation> {
    this.loading = true;
    this.error = null;
    try {
      const operation = await this.api.createOperation(payload);
      runInAction(() => {
        this.operations.push(operation);
      });
      return operation;
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to create operation";
      });
      throw e;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async updateOperation(
    payload: IOperationUpdatePayload,
  ): Promise<IOperation> {
    this.loading = true;
    this.error = null;
    try {
      const updated = await this.api.updateOperation(payload);
      runInAction(() => {
        const idx = this.operations.findIndex((o) => o.id === updated.id);
        if (idx !== -1) {
          this.operations[idx] = updated;
        }
      });
      return updated;
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to update operation";
      });
      throw e;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async deleteOperation(id: OperationId): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      await this.api.deleteOperation(id);
      runInAction(() => {
        this.operations = this.operations.filter((o) => o.id !== id);
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to delete operation";
      });
      throw e;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }
}

export const operationStore = new OperationStore();

