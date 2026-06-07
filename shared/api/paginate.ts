import type { IListParams, IListResult } from "@/shared/api/types";

export function paginateList<T>(
  items: T[],
  params?: IListParams,
): IListResult<T> {
  const limit = params?.limit;
  if (limit == null || limit <= 0) {
    return { items, more: false };
  }
  const page = params?.page ?? 1;
  const start = (page - 1) * limit;
  const pageItems = items.slice(start, start + limit);
  return {
    items: pageItems,
    more: start + pageItems.length < items.length,
  };
}
