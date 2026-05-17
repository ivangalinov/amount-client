import { runInAction } from "mobx";
import type {
  IOperation,
  OperationId,
} from "@/entities/operation/model/types";
import type {
  IOperationApi,
  IOperationCreatePayload,
  IOperationUpdatePayload,
} from "@/entities/operation/api/types";
import OperationRemoteApi from "@/entities/operation/api/remote";
import type { IListResult } from "@/shared/api/types";

import ListStore, { IListParams as ILParams } from '@/shared/store/list-store';
import { CategoryType } from "@/entities/category";

interface IFilter {
  workspaceId?: number;
  userId?: number;
  categoryId?: number;
  dateFrom?: string;
  dateTo?: string;
  type?: CategoryType;
}

export class OperationStore extends ListStore<IOperation, IFilter> {

  keyProperty: string = 'id';

  constructor(private readonly _api: IOperationApi = new OperationRemoteApi()) {
    super();    
  }

  async create(
    payload: IOperationCreatePayload,
  ): Promise<IOperation> {
    this.loading = true;
    this.error = null;
    try {
      const operation = await this._api.createOperation(payload);
  
      this.addItem(operation);

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

  async update(
    payload: IOperationUpdatePayload,
  ): Promise<IOperation> {
    this.loading = true;
    this.error = null;
    try {
      const updated = await this._api.updateOperation(payload);
      this.pathItem(updated.id, updated);
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

  async delete(id: OperationId): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      await this._api.deleteOperation(id);
      this.deleteItem(id);
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

  protected _fetchItems(params: ILParams<IFilter>): Promise<IListResult<IOperation>> {

    const {
      workspaceId,
      userId,
      categoryId,
      dateFrom,
      dateTo,
      type
    } = params.filter;

    return this._api.listOperations({
      workspaceId,
      userId,
      categoryId,
      dateFrom,
      dateTo,
      type,
      page: params.navigation?.page,
      limit: params.navigation?.limit
    });
  }
}

export const operationStore = new OperationStore();
