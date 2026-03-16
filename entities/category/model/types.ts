import type { UserId } from "@/entities/user/model/types";
import type { WorkspaceId } from "@/entities/workspace/model/types";

export type CategoryId = number;

export enum CategoryType {
  Expense = "expense",
  Income = "income",
}

export interface Category {
  id: CategoryId;
  name: string;
  workspaceId: WorkspaceId;
  limit?: string;
  type: CategoryType;
  userId: UserId;
  color: string;
}

