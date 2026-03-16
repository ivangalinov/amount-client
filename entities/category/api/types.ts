import type {
  Category,
  CategoryId,
  CategoryType,
} from "@/entities/category/model/types";
import type { WorkspaceId } from "@/entities/workspace/model/types";
import type { UserId } from "@/entities/user/model/types";
import type { ListParams, ListResult } from "@/shared/api/types";

export interface CategoryCreatePayload {
  name: string;
  workspaceId: WorkspaceId;
  type: CategoryType;
  userId: UserId;
  color?: string;
  limit?: string;
}

export interface CategoryUpdatePayload {
  id: CategoryId;
  name?: string;
  type?: CategoryType;
  color?: string;
  limit?: string;
}

export interface CategoryListParams extends ListParams {
  workspaceId?: WorkspaceId;
  userId?: UserId;
  type?: CategoryType;
}

export interface CategoryApi {
  listCategories(params?: CategoryListParams): Promise<ListResult<Category>>;
  getCategoryById(id: CategoryId): Promise<Category | null>;
  createCategory(payload: CategoryCreatePayload): Promise<Category>;
  updateCategory(payload: CategoryUpdatePayload): Promise<Category>;
  deleteCategory(id: CategoryId): Promise<void>;
}

