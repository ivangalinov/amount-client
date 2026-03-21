// Common list helpers used across entity APIs
export interface IListParams {
  limit?: number;
  offset?: number;
}

export interface IListResult<T> {
  items: T[];
  total: number;
}

// Basic storage API used by concrete implementations (e.g. localStorage)
export interface IKeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

