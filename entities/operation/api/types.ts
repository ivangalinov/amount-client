import type {
  IOperation,
  OperationId,
} from "@/entities/operation/model/types";
import type { CategoryId } from "@/entities/category/model/types";
import type { WorkspaceId } from "@/entities/workspace/model/types";
import type { UserId } from "@/entities/user/model/types";
import type { IListParams, IListResult } from "@/shared/api/types";

export interface IOperationListParams extends IListParams {
  workspaceId?: WorkspaceId;
  userId?: UserId;
  categoryId?: CategoryId;
  dateFrom?: string;
  dateTo?: string;
}

export interface IOperationCreatePayload {
  amount: number;
  categoryId: CategoryId;
  title: string;
  /** Для локального API; удалённый бэкенд выставляет автора из сессии. */
  userId?: UserId;
  workspaceId: WorkspaceId;
  createdAt?: string;
}

export interface IOperationUpdatePayload {
  id: OperationId;
  amount?: number;
  categoryId?: CategoryId;
  title?: string;
  createdAt?: string;
}

export interface IOperationApi {
  listOperations(params?: IOperationListParams): Promise<IListResult<IOperation>>;
  getOperationById(id: OperationId): Promise<IOperation | null>;
  createOperation(payload: IOperationCreatePayload): Promise<IOperation>;
  updateOperation(payload: IOperationUpdatePayload): Promise<IOperation>;
  deleteOperation(id: OperationId): Promise<void>;
}

