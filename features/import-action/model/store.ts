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
        localId: `${row.ext_key}-${index}`,
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

    get selectedCount(): number {
        return this.items.filter((row: IEditableImportRow) => (
            row.selected
        )).length;
    }

    private readonly _apiClient = new APIClient();

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    async parseFile(file: File, source: string): Promise<void> {
        this.inProgress = true;
        try {
            const items = await this._apiClient.batchImport(file, source);
            this.items = items.map(mapImportRow);
        } catch(error) {
            this.importError = (error as Error).toString();
        } finally {
            this.inProgress = false;
        }
        
    }

    async save(workspaceId: number): Promise<{created: number}> {
        const items = this.items.map((row: IEditableImportRow) => {
            return {
                amount: Number(row.amount),
                category_id: Number(row.categoryId),
                title: row.title.trim(),
                workspace_id: workspaceId,
                created: new Date(row.createdAt).toISOString(),
                ext_key: row.ext_key,
                ext_source: row.ext_source,
                type: row.type
            };
        });
        const response = await this._apiClient.bulkUpdate({ items, workspaceId });
        return response;
    }

    toggleSelection(localId: string): void {
        runInAction(() => {
            this.items = this.items.map((row: IEditableImportRow) => {
                if (row.localId !== localId) {
                    return {...row};
                }
                return {
                    ...row,
                    selected: !row.selected
                }
            });
        })
    }

    selectAll(): void {
        this.items = this.items.map((row: IEditableImportRow) => ({
            ...row,
            selected: true
        }));
    }

    unselectAll(): void {
        this.items = this.items.map((row: IEditableImportRow) => ({
            ...row,
            selected: false
        }));
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
