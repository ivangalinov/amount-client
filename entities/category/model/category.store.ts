import { makeAutoObservable, runInAction } from "mobx";
import type {
  ICategory,
  CategoryId,
  CategoryType,
} from "@/entities/category/model/types";
import type {
  ICategoryApi,
  ICategoryCreatePayload,
  ICategoryListParams,
  ICategoryUpdatePayload,
} from "@/entities/category/api/types";
import CategoryAPI from '@/entities/category/api/remote';
import type { IListResult } from "@/shared/api/types";

export class CategoryStore {
  private api: ICategoryApi;

  categories: ICategory[] = [];
  loading = false;
  error: string | null = null;

  constructor(api: ICategoryApi = new CategoryAPI()) {
    this.api = api;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get categoriesById(): Map<CategoryId, ICategory> {
    return new Map(this.categories.map((c) => [c.id, c]));
  }

  async loadCategories(params?: ICategoryListParams): Promise<void> {
    if (this.categories.length) {
      return;
    }
    this.loading = true;
    this.error = null;
    try {
      const result: IListResult<ICategory> = await this.api.listCategories(
        params,
      );
      runInAction(() => {
        this.categories = result.items;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to load categories";
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async createCategory(payload: ICategoryCreatePayload): Promise<ICategory> {
    this.loading = true;
    this.error = null;
    try {
      const category = await this.api.createCategory(payload);
      runInAction(() => {
        this.categories.push(category);
      });
      return category;
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to create category";
      });
      throw e;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async updateCategory(payload: ICategoryUpdatePayload): Promise<ICategory> {
    this.loading = true;
    this.error = null;
    try {
      const updated = await this.api.updateCategory(payload);
      runInAction(() => {
        const idx = this.categories.findIndex((c) => c.id === updated.id);
        if (idx !== -1) {
          this.categories[idx] = updated;
        }
      });
      return updated;
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to update category";
      });
      throw e;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async deleteCategory(id: CategoryId): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      await this.api.deleteCategory(id);
      runInAction(() => {
        this.categories = this.categories.filter((c) => c.id !== id);
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : "Failed to delete category";
      });
      throw e;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  getCategoriesByType(type: CategoryType): ICategory[] {
    return this.categories.filter((c) => c.type === type);
  }
}

export const categoryStore = new CategoryStore();
