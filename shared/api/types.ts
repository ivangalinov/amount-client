// Common list helpers used across entity APIs
export interface ListParams {
  limit?: number;
  offset?: number;
}

export interface ListResult<T> {
  items: T[];
  total: number;
}

// Basic storage API used by concrete implementations (e.g. localStorage)
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

