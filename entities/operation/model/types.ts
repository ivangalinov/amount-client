import type { CategoryId } from "@/entities/category/model/types";
import type { UserId } from "@/entities/user/model/types";
import type { WorkspaceId } from "@/entities/workspace/model/types";

export type OperationId = number;

export interface IOperation {
  id: OperationId;
  amount: number;
  categoryId: CategoryId;
  title: string;
  userId: UserId;
  workspaceId: WorkspaceId;
  createdAt: string;
}

