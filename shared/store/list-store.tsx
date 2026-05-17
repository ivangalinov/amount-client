import { action, makeAutoObservable, makeObservable, observable, runInAction } from "mobx";

interface IListResult<T> {
    items: T[];
    more: boolean;
}

export interface IListParams<F> {
    filter: F;
    navigation?: {
        limit: number;
        page: number;
    }
}

export default abstract class ListStore<T, F = Record<string, unknown>> {

    loading: boolean = false;
    error: string | null = null;
    items: T[] = [];
    listParams: IListParams<F> | null = null;
    hasMore: boolean | null = null;

    abstract keyProperty: string;

    constructor() {
        makeObservable(this, {
            loading: observable,
            error: observable,
            items: observable,
            hasMore: observable,
            reload: action
        })
    }

    async load(params: IListParams<F>): Promise<void> {
        if (this.items.length) {
            return;
        }

        this.listParams = params;
        return this.reload();
    }

    async reload() {
        if (!this.listParams) {
            return;
        }
        this.loading = true;
        try {
            const { items, more } = await this._fetchItems(this.listParams);
            runInAction(() => {
                this.items = items;
                this.hasMore = more;
            });
        } catch(error) {
            this.error = (error as Error).message;
        } finally {
            this.loading = false;
        }
    }

    setListParams(listParams: IListParams<F>): Promise<void> {
        this.listParams = listParams;
        return this.reload();
    }

    updateFilter(filter: Partial<IListParams<F>['filter']>): Promise<void> {
        if (!this.listParams) {
            throw new Error('ListStore:updateFilter|Empty filter');
        }
        this.listParams = {
            ...this.listParams,
            filter: {
                ...this.listParams?.filter,
                ...filter
            }
        }
        return this.reload();
    }

    nextPage(): Promise<void> {
        if (!this.hasMore) {
            return Promise.resolve();
        }

        if (!this.listParams?.navigation) {
            throw new Error('ListStore:nextPage|Empty navigation');
        }

        this.listParams = {
            ...this.listParams,
            navigation: {
                ...this.listParams?.navigation,
                page: this.listParams?.navigation.page + 1
            }
        }
        return this.reload();
    }

    addItem(item: T): void {
        runInAction(() => {
            this.items = [
      
              item,
              ...this.items
            ]
          });
    }

    pathItem(key: number, item: Partial<T>): void {
        runInAction(() => {
          //@ts-expect-error
          const idx = this.items.findIndex((o) => o[this.keyProperty] === key);
    
          if (idx !== -1) {
            this.items[idx] = {
                ...this.items[idx],
                ...item
            };
          };
        });
      }

    deleteItem(key: number): void {
        runInAction(() => {
            //@ts-expect-error
            this.items = this.items.filter((item) => item[this.keyProperty] !== key);
        });
    }

    protected abstract _fetchItems(params: IListParams<F>): Promise<IListResult<T>>;
}
