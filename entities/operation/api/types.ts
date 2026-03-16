import type {
  Operation,
  OperationId,
} from "@/entities/operation/model/types";
import type { CategoryId } from "@/entities/category/model/types";
import type { WorkspaceId } from "@/entities/workspace/model/types";
import type { UserId } from "@/entities/user/model/types";
import type { ListParams, ListResult } from "@/shared/api/types";

export interface OperationListParams extends ListParams {
  workspaceId?: WorkspaceId;
  userId?: UserId;
  categoryId?: CategoryId;
  dateFrom?: string;
  dateTo?: string;
}

export interface OperationCreatePayload {
  amount: number;
  categoryId: CategoryId;
  title: string;
  userId: UserId;
  workspaceId: WorkspaceId;
  createdAt?: string;
}

export interface OperationUpdatePayload {
  id: OperationId;
  amount?: number;
  categoryId?: CategoryId;
  title?: string;
  createdAt?: string;
}

export interface OperationApi {
  listOperations(params?: OperationListParams): Promise<ListResult<Operation>>;
  getOperationById(id: OperationId): Promise<Operation | null>;
  createOperation(payload: OperationCreatePayload): Promise<Operation>;
  updateOperation(payload: OperationUpdatePayload): Promise<Operation>;
  deleteOperation(id: OperationId): Promise<void>;
}

