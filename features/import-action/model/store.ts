import { IOperationImportRow } from "@/entities/operation/api/types";
import { makeAutoObservable, runInAction } from "mobx";
import { createContext, useContext } from "react";
import APIClient from "@/entities/operation/api/remote";

interface IEditableImportRow extends IOperationImportRow {
    localId: string;
    selected: boolean;
    categoryId: string;
    createdAt: string;
    title: string;
}

function toDatetimeLocal(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return new Date().toISOString().slice(0, 16);
    }
    const localMs = date.getTime() - date.getTimezoneOffset() * 60_000;
    return new Date(localMs).toISOString().slice(0, 16);
}

function buildTitle(origin: string): string {
    const firstLine = origin
        .split("\n")
        .map((line) => line.trim())
        .find(Boolean);
    return (firstLine ?? "Импортированная операция").slice(0, 120);
}

function mapImportRow(row: IOperationImportRow, index: number): IEditableImportRow {
    return {
        ...row,
        /** index first so keys stay unique even when ext_key repeats */
        localId: `${index}-${row.ext_key}`,
        selected: !(row.errors?.length),
        categoryId: row.category_id != null ? String(row.category_id) : "",
        createdAt: toDatetimeLocal(row.created),
        title: buildTitle(row.origin),
    };

}
export default class ImportOperationStore {

    items: IEditableImportRow[] = [];
    inProgress: boolean = false;
    importError: string | null = null;
    saveError: string | null = null;
    validateError: string | null = null;

    get selectedCount(): number {
        return this.items.filter((row: IEditableImportRow) => (
            row.selected
        )).length;
    }

    get selectedItems(): IEditableImportRow[] {
        return this.items.filter((row: IEditableImportRow) => (
            row.selected
        ))
    }

    private readonly _apiClient = new APIClient();

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    async parseFile(file: File, source: string): Promise<void> {
        runInAction(() => {
            this.inProgress = true;
            this.importError = null;
        });
        try {
            const items = await this._apiClient.batchImport(file, source);
            runInAction(() => {
                this.items = items.map(mapImportRow);
            });
        } catch (error) {
            runInAction(() => {
                this.importError = (error as Error).toString();
            });
        } finally {
            runInAction(() => {
                this.inProgress = false;
            });
        }

    }

    async save(workspaceId: number): Promise<{ created: number }> {
        this.inProgress = true;
        const { selectedItems } = this;
        const validateResult = this._validate(selectedItems);
        if (validateResult !== true) {
            this.validateError = typeof validateResult === 'string' ? validateResult : 'Ошибка валидации';
            return Promise.reject(new Error('validate error'));
        }
        const items = selectedItems.map((row: IEditableImportRow) => {
            return {
                amount: Number(row.amount),
                category_id: Number(row.categoryId),
                title: row.title.trim(),
                created: new Date(row.createdAt).toISOString(),
                ext_key: row.ext_key,
                ext_source: row.ext_source,
            };
        });
        try {
            return this._apiClient.bulkUpdate({ items, workspaceId });
        } catch (error) {
            this.saveError = (error as Error).message;
            return { created: 0 };
        } finally {
            runInAction(() => {
                this.inProgress = false;
            })
        }
    }

    selectAll(): void {
        runInAction(() => {
            this.items = this.items.map((row: IEditableImportRow) => ({
                ...row,
                selected: true
            }));
        });
    }

    unselectAll(): void {
        runInAction(() => {
            this.items = this.items.map((row: IEditableImportRow) => ({
                ...row,
                selected: false
            }));
        });
    }

    updateRow(localId: string, patch: Partial<IEditableImportRow>): void {
        runInAction(() => {
            this.items = this.items.map((row: IEditableImportRow) =>
                row.localId === localId ? { ...row, ...patch } : row,
            );
        });
    }

    clearItems(): void {
        runInAction(() => {
            this.items = [];
        });
    }

    private _validate(selectedItems: IEditableImportRow[]): boolean | string {
        for (const row of selectedItems) {
            if (!row.selected) {
                continue;
            }
            if (!row.title.trim()) {
                return "У каждой выбранной записи должно быть название";
            }
            if (!row.categoryId) {
                return "У каждой выбранной записи должна быть категория";
            }
            if (Number.isNaN(Number(row.amount))) {
                return "У выбранных записей должна быть корректная сумма";
            }
        }
        return true;
    }
}

export const ImportContext = createContext<ImportOperationStore | null>(null);


export function useImportStore() {
    const ctx = useContext(ImportContext);
    if (!ctx) {
        throw new Error();
    }
    return ctx;
}

//   if (!activeWorkspace) {
//     return "Сначала выберите рабочее пространство";
//   }
//   if (!store.selectedCount) {
//     return "Выберите хотя бы одну запись для сохранения";
//   }
//   for (const row of store.items) {
//     if (!row.selected) {
//       continue;
//     }
//     if (!row.title.trim()) {
//       return "У каждой выбранной записи должно быть название";
//     }
//     if (!row.categoryId) {
//       return "У каждой выбранной записи должна быть категория";
//     }
//     if (Number.isNaN(Number(row.amount))) {
//       return "У выбранных записей должна быть корректная сумма";
//     }
//   }
//   return null;
// };