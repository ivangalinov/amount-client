import type { CategoryId } from "@/entities/category/model/types";
import type { UserId } from "@/entities/user/model/types";
import type { WorkspaceId } from "@/entities/workspace/model/types";

export type OperationId = number;

export interface IOperation {
  id: OperationId;
  amount: number;
  categoryId: CategoryId;
  categoryName: string;
  categoryColor: string;
  title: string;
  userId: UserId;
  userName: string;
  workspaceId: WorkspaceId;
  createdAt: string;
}
