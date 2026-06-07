import type { IListResult } from "@/shared/api/types";
import { paginateList } from "@/shared/api/paginate";
import {
  type ICategory,
  type CategoryId,
  CategoryType,
} from "../model/types";
import type {
  ICategoryApi,
  ICategoryCreatePayload,
  ICategoryListParams,
  ICategoryUpdatePayload,
} from "./types";
import { getApiBase } from "@/shared/lib/api-base";
import { parseFastApiError } from "@/shared/lib/fastapi-error";

type ApiCategoryRow = {
  id?: number;
  name?: string;
  type?: string;
  color?: string;
  limit?: string | null;
  workspace_id?: number;
  user_id?: number | null;
};

function mapCategoryFromApi(row: ApiCategoryRow): ICategory {
  const typeStr = row.type ?? CategoryType.Expense;
  const type =
    typeStr === CategoryType.Income ||
    typeStr === CategoryType.Expense ||
    typeStr === CategoryType.Transfer
      ? (typeStr as CategoryType)
      : CategoryType.Expense;

  return {
    id: row.id as CategoryId,
    name: String(row.name ?? ""),
    workspaceId: row.workspace_id ?? 0,
    limit: row.limit ?? undefined,
    type,
    userId: (row.user_id ?? 0) as ICategory["userId"],
    color: String(row.color ?? "#808080"),
  };
}

function toApiCreateBody(p: ICategoryCreatePayload): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: p.name,
    workspace_id: p.workspaceId,
    type: p.type,
    color: p.color?.trim() || "#808080",
  };
  if (p.limit != null && p.limit !== "") body.limit = p.limit;
  return body;
}

function toApiUpdateBody(
  p: ICategoryUpdatePayload,
): Record<string, unknown> | undefined {
  const body: Record<string, unknown> = {};
  if (p.name !== undefined) body.name = p.name;
  if (p.type !== undefined) body.type = p.type;
  if (p.color !== undefined) body.color = p.color;
  if (p.limit !== undefined) body.limit = p.limit === "" ? null : p.limit;
  return Object.keys(body).length ? body : undefined;
}

interface IRequestParams {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

export default class RemoteCategoryApi implements ICategoryApi {
  async listCategories(
    params?: ICategoryListParams,
  ): Promise<IListResult<ICategory>> {
    const searchParams = new URLSearchParams();
    if (params?.type) {
      searchParams.append("type", params.type);
    }
    const qs = searchParams.toString();
    const path = qs ? `category?${qs}` : "category";

    const raw = await this._fetchJson<{
      items: ApiCategoryRow[];
      total?: number;
    }>(path);

    let items = (raw.items ?? []).map(mapCategoryFromApi);

    const filteredByWorkspace = params?.workspaceId != null;
    const filteredByUser = params?.userId != null;
    if (filteredByWorkspace) {
      items = items.filter((c) => c.workspaceId === params.workspaceId);
    }
    if (filteredByUser) {
      items = items.filter((c) => c.userId === params.userId);
    }

    if (filteredByWorkspace || filteredByUser) {
      return paginateList(items, params);
    }

    const limit = params?.limit;
    if (limit == null || limit <= 0) {
      return { items, more: false };
    }
    const page = params?.page ?? 1;
    const start = (page - 1) * limit;
    const pageItems = items.slice(start, start + limit);
    const serverTotal = raw.total ?? items.length;
    return {
      items: pageItems,
      more: start + pageItems.length < serverTotal,
    };
  }

  async getCategoryById(key: CategoryId): Promise<ICategory | null> {
    const res = await this._rawFetch(`category/${key}`);
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(parseFastApiError(text) || `HTTP ${res.status}`);
    }
    const text = await res.text();
    if (!text.trim()) return null;
    const row = JSON.parse(text) as ApiCategoryRow;
    return mapCategoryFromApi(row);
  }

  async createCategory(
    payload: ICategoryCreatePayload,
  ): Promise<ICategory> {
    const body = toApiCreateBody(payload);
    const row = await this._fetchJson<ApiCategoryRow>("category", {
      method: "POST",
      body,
    });
    if (row == null || row.id == null) {
      throw new Error("Сервер не вернул созданную категорию");
    }
    return mapCategoryFromApi(row);
  }

  async updateCategory(payload: ICategoryUpdatePayload): Promise<ICategory> {
    if (!payload.id) {
      throw new Error("Невозможно обновить категорию без id");
    }
    const updateBody = toApiUpdateBody(payload);
    const row = await this._fetchJson<ApiCategoryRow>(
      `category/${payload.id}`,
      {
        method: "PATCH",
        body: updateBody ?? {},
      },
    );
    if (row == null || row.id == null) {
      throw new Error("Сервер не вернул обновлённую категорию");
    }
    return mapCategoryFromApi(row);
  }

  async deleteCategory(key: CategoryId): Promise<void> {
    await this._fetchJson(`category/${key}`, { method: "DELETE" });
  }

  private async _rawFetch(
    url: string,
    params?: IRequestParams,
  ): Promise<Response> {
    const { method = "GET" } = params || {};
    const jsonBody =
      params?.body !== undefined ? JSON.stringify(params.body) : undefined;

    const headers = new Headers();
    if (jsonBody !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    return fetch(`${getApiBase()}/${url}`, {
      method,
      body: jsonBody,
      headers,
      credentials: "include",
    });
  }

  private async _fetchJson<T>(
    url: string,
    params?: IRequestParams,
  ): Promise<T> {
    try {
      const res = await this._rawFetch(url, params);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(
          parseFastApiError(errText) || `HTTP ${res.status} ${res.statusText}`,
        );
      }

      if (res.status === 204) {
        return undefined as T;
      }

      const text = await res.text();
      if (!text.trim()) {
        return undefined as T;
      }
      return JSON.parse(text) as T;
    } catch (e) {
      console.error(`ошибка при выполнении запроса ${url}`, e);
      throw e;
    }
  }
}
