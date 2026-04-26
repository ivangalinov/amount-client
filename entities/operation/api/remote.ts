import type { IListResult } from "@/shared/api/types";
import { getApiBase } from "@/shared/lib/api-base";
import { parseFastApiError } from "@/shared/lib/fastapi-error";
import type {
  IOperation,
  OperationId,
} from "@/entities/operation/model/types";
import type {
  IOperationApi,
  IOperationCreatePayload,
  IOperationListParams,
  IOperationUpdatePayload,
} from "@/entities/operation/api/types";
import type { CategoryId } from "@/entities/category/model/types";
import type { UserId } from "@/entities/user/model/types";
import type { WorkspaceId } from "@/entities/workspace/model/types";

type ApiOperationRow = {
  id?: number;
  amount?: number;
  category_id?: number;
  category_name?: string;
  category_color?: string;
  title?: string;
  user_id?: number;
  user_name?: string;
  workspace_id?: number;
  created?: string;
};

function mapOperation(row: ApiOperationRow): IOperation {
  return {
    id: row.id as OperationId,
    amount: Number(row.amount ?? 0),
    categoryId: (row.category_id ?? 0) as CategoryId,
    categoryName: row.category_name as string,
    categoryColor: row.category_color as string,
    title: String(row.title ?? ""),
    userId: (row.user_id ?? 0) as UserId,
    userName: row.user_name as string,
    workspaceId: (row.workspace_id ?? 0) as WorkspaceId,
    createdAt: String(row.created ?? new Date().toISOString()),
  };
}

interface IRequestParams {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

export default class OperationRemoteApi implements IOperationApi {
  async listOperations(
    params?: IOperationListParams,
  ): Promise<IListResult<IOperation>> {
    if (params?.workspaceId == null) {
      throw new Error("workspaceId обязателен для списка операций");
    }
    const searchParams = new URLSearchParams();
    searchParams.set("workspace_id", String(params.workspaceId));
    if (params.categoryId != null) {
      searchParams.set("category_id", String(params.categoryId));
    }
    if (params.userId != null) {
      searchParams.set("user_id", String(params.userId));
    }
    if (params.dateFrom != null) {
      searchParams.set("date_from", params.dateFrom);
    }
    if (params.dateTo != null) {
      searchParams.set("date_to", params.dateTo);
    }
    if (params.limit != null) {
      searchParams.set("limit", String(params.limit));
    }
    if (params.page != null) {
      searchParams.set("page", String(params.page));
    }

    if (!!params.type) {
      searchParams.set('type', params.type);
    }

    const raw = await this._fetchJson<{
      items: ApiOperationRow[];
      more: boolean;
    }>(`operation?${searchParams.toString()}`);

    const items = (raw.items ?? []).map(mapOperation);
    return { items, more: raw.more };
  }

  async getOperationById(id: OperationId): Promise<IOperation | null> {
    const res = await this._rawFetch(`operation/${id}`);
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(parseFastApiError(text) || `HTTP ${res.status}`);
    }
    const text = await res.text();
    if (!text.trim()) return null;
    const row = JSON.parse(text) as ApiOperationRow;
    return mapOperation(row);
  }

  async createOperation(
    payload: IOperationCreatePayload,
  ): Promise<IOperation> {
    const body: Record<string, unknown> = {
      workspace_id: payload.workspaceId,
      category_id: payload.categoryId,
      title: payload.title,
      amount: Math.round(Number(payload.amount)),
    };
    if (payload.createdAt != null) {
      body.created = payload.createdAt;
    }
    const row = await this._fetchJson<ApiOperationRow>("operation", {
      method: "POST",
      body,
    });
    if (row == null || row.id == null) {
      throw new Error("Сервер не вернул созданную операцию");
    }
    return mapOperation(row);
  }

  async updateOperation(
    payload: IOperationUpdatePayload,
  ): Promise<IOperation> {
    if (!payload.id) {
      throw new Error("Невозможно обновить операцию без id");
    }
    const body: Record<string, unknown> = {};
    if (payload.amount !== undefined) {
      body.amount = Math.round(Number(payload.amount));
    }
    if (payload.title !== undefined) body.title = payload.title;
    if (payload.categoryId !== undefined) {
      body.category_id = payload.categoryId;
    }
    if (payload.createdAt !== undefined) {
      body.created = payload.createdAt;
    }
    const row = await this._fetchJson<ApiOperationRow>(
      `operation/${payload.id}`,
      {
        method: "PATCH",
        body,
      },
    );
    if (row == null || row.id == null) {
      throw new Error("Сервер не вернул обновлённую операцию");
    }
    return mapOperation(row);
  }

  async deleteOperation(id: OperationId): Promise<void> {
    await this._fetchJson(`operation/${id}`, { method: "DELETE" });
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
