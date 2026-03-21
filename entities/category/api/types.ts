import type {
  ICategory,
  CategoryId,
  CategoryType,
} from "@/entities/category/model/types";
import type { WorkspaceId } from "@/entities/workspace/model/types";
import type { UserId } from "@/entities/user/model/types";
import type { IListParams, IListResult } from "@/shared/api/types";

export interface ICategoryCreatePayload {
  name: string;
  workspaceId: WorkspaceId;
  type: CategoryType;
  userId: UserId;
  color?: string;
  limit?: string;
}

export interface ICategoryUpdatePayload {
  id: CategoryId;
  name?: string;
  type?: CategoryType;
  color?: string;
  limit?: string;
}

export interface ICategoryListParams extends IListParams {
  workspaceId?: WorkspaceId;
  userId?: UserId;
  type?: CategoryType;
}

export interface ICategoryApi {
  listCategories(params?: ICategoryListParams): Promise<IListResult<ICategory>>;
  getCategoryById(id: CategoryId): Promise<ICategory | null>;
  createCategory(payload: ICategoryCreatePayload): Promise<ICategory>;
  updateCategory(payload: ICategoryUpdatePayload): Promise<ICategory>;
  deleteCategory(id: CategoryId): Promise<void>;
}
