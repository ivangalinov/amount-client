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
import OperationRemoteApi from "@/entities/operation/api/remote";
import { operationLocalStorageApi } from "@/entities/operation/api/local-storage";
import type { IListParams, IListResult } from "@/shared/api/types";

export class OperationStore {
  private readonly injectedApi: IOperationApi | null;

  operations: IOperation[] = [];
  hasMore: boolean = false;
  listParams: IListParams = {};
  loading: boolean = false;
  error: string | null = null;

  constructor(api?: IOperationApi) {
    this.injectedApi = api ?? null;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  private resolveApi(): IOperationApi {
    if (this.injectedApi) {
      return this.injectedApi;
    }
    return typeof window !== "undefined"
      ? new OperationRemoteApi()
      : operationLocalStorageApi;
  }

  async loadOperations(params: IOperationListParams = {}): Promise<void> {
    this.loading = true;
    this.error = null;
    if (!params?.page) {
      params.page = 0;
    }
    try {
      const result: IListResult<IOperation> = await this.resolveApi().listOperations(params);
      runInAction(() => {
        this.operations = result.items;
        this.hasMore = result.more;
        this.listParams = params;
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

  nextPage(): Promise<void> {
    if (!this.operations.length) {
      throw new Error();
    }

    if (!this.hasMore) {
      return Promise.resolve();
    }
    const params = {
      ...this.listParams,
      page: (this.listParams.page || 0) + 1
    };
    return this.loadOperations(params);
  }

  async createOperation(
    payload: IOperationCreatePayload,
  ): Promise<IOperation> {
    this.loading = true;
    this.error = null;
    try {
      const operation = await this.resolveApi().createOperation(payload);
  
      runInAction(() => {
        this.operations = [
  
          operation,
          ...this.operations
        ]
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
      const updated = await this.resolveApi().updateOperation(payload);

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
      await this.resolveApi().deleteOperation(id);
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
