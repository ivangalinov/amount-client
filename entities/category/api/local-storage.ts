import type {
  ICategory,
  CategoryId,
  CategoryType,
} from "@/entities/category/model/types";
import type { ICategoryApi, ICategoryCreatePayload, ICategoryListParams, ICategoryUpdatePayload } from "@/entities/category/api/types";
import type { WorkspaceId } from "@/entities/workspace/model/types";
import type { UserId } from "@/entities/user/model/types";
import type { IListResult } from "@/shared/api/types";

import { keyValueStorage } from "@/shared/api/local-storage";

const CATEGORIES_KEY = "amount:categories";

async function readCategories(): Promise<ICategory[]> {
  const raw = await keyValueStorage.getItem(CATEGORIES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ICategory[];
  } catch {
    return [];
  }
}

async function writeCategories(categories: ICategory[]): Promise<void> {
  await keyValueStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

function filterCategories(
  categories: ICategory[],
  params?: ICategoryListParams,
): ICategory[] {
  if (!params) return categories;
  return categories.filter((c) => {
    if (params.workspaceId != null && c.workspaceId !== params.workspaceId) {
      return false;
    }
    if (params.userId != null && c.userId !== params.userId) {
      return false;
    }
    if (params.type != null && c.type !== params.type) {
      return false;
    }
    return true;
  });
}

function paginate<T>(items: T[], params?: ICategoryListParams): IListResult<T> {
  const { limit, offset } = params ?? {};
  if (limit == null && offset == null) {
    return { items, total: items.length };
  }
  const start = offset ?? 0;
  const end = limit != null ? start + limit : undefined;
  return {
    items: items.slice(start, end),
    total: items.length,
  };
}

export const categoryLocalStorageApi: ICategoryApi = {
  async listCategories(
    params?: ICategoryListParams,
  ): Promise<IListResult<ICategory>> {
    const all = await readCategories();
    const filtered = filterCategories(all, params);
    return paginate(filtered, params);
  },

  async getCategoryById(id: CategoryId): Promise<ICategory | null> {
    const categories = await readCategories();
    return categories.find((c) => c.id === id) ?? null;
  },

  async createCategory(payload: ICategoryCreatePayload): Promise<ICategory> {
    const categories = await readCategories();
    const nextId = categories.length
      ? Math.max(...categories.map((c) => c.id)) + 1
      : 1;

    const category: ICategory = {
      id: nextId,
      name: payload.name,
      workspaceId: payload.workspaceId as WorkspaceId,
      type: payload.type as CategoryType,
      userId: payload.userId as UserId,
      color: payload.color ?? "#000000",
      limit: payload.limit,
    };

    categories.push(category);
    await writeCategories(categories);
    return category;
  },

  async updateCategory(payload: ICategoryUpdatePayload): Promise<ICategory> {
    const categories = await readCategories();
    const idx = categories.findIndex((c) => c.id === payload.id);
    if (idx === -1) {
      throw new Error("Category not found");
    }

    const updated: ICategory = {
      ...categories[idx],
      ...payload,
    };

    categories[idx] = updated;
    await writeCategories(categories);
    return updated;
  },

  async deleteCategory(id: CategoryId): Promise<void> {
    const categories = await readCategories();
    const next = categories.filter((c) => c.id !== id);
    await writeCategories(next);
  },
};

