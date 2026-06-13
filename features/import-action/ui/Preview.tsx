"use client";

import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import { Input } from "@heroui/input";
import { ModalBody, ModalFooter, ModalHeader } from "@heroui/modal";
import { FORM_MODAL_BODY_CLASS } from "@/shared/ui/form-modal";
import type {
    OperationImportSource,
} from "@/entities/operation/api/types";
import { useImportStore } from "../model/store";
import { Select, SelectItem } from "@heroui/select";
import { CategoryType } from "@/entities/category";
import { useRootStore } from "@/shared/store/root-store";
import { IEditableImportRow } from '../model/types';
import { SharedSelection } from "@heroui/system";

const SOURCE_LABELS: Record<OperationImportSource, string> = {
    sber: "Сбер",
    tinkoff: "Тинькофф",
};

const TYPE_LABELS: Record<CategoryType, string> = {
    expense: "Расход",
    income: "Доход",
    transfer: "Перевод",
};

interface IRowProps {
    row: IEditableImportRow;
}

const PreviewRow = observer(({ row }: IRowProps) => {

    const { category: categoryStore } = useRootStore();
    const store = useImportStore();

    const { localId } = row;

    const onSelect = useCallback((selected: boolean) => {
        store.updateRow(localId, { selected })
    }, [store, localId]);

    const onUpdateName = useCallback((value: string) => {
        store.updateRow(localId, { title: value });
    }, [store, localId]);

    const onUpdateAmount = useCallback((value: string) => {
        const parsed = Number(value);
        if (Number.isNaN(parsed)) {
            return;
        }
        store.updateRow(localId, { amount: parsed });
    }, [store, localId]);

    const onUpdateCategory = useCallback((keys: SharedSelection) => {
        const value = Array.from(keys)[0];
        store.updateRow(localId, {
            categoryId: value != null ? String(value) : "",
        });
    }, [store, localId]);

    const onUpdateCreated = useCallback((value: string) => {
        store.updateRow(localId, { createdAt: value })
    }, [store, localId]);

    return (
        <div
            key={row.localId}
            className="rounded-xl border border-default-200 p-4 flex flex-col gap-3"
        >
            <div className="flex flex-wrap items-center gap-3">
                <Switch
                    size="sm"
                    isSelected={row.selected}
                    onValueChange={onSelect}
                >
                    Сохранить
                </Switch>
                <span className="text-xs text-default-500">
                    Источник: {SOURCE_LABELS[row.ext_source as OperationImportSource] ?? row.ext_source}
                </span>
                <span className="text-xs text-default-500">
                    Тип: {TYPE_LABELS[row.type]}
                </span>
            </div>

            {!!row.errors?.length && (
                <p className="text-xs text-danger">
                    Ошибки разбора: {row.errors.join(", ")}
                </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                    label="Название"
                    value={row.title}
                    onValueChange={onUpdateName}
                />
                <Input
                    type="number"
                    label="Сумма"
                    value={String(row.amount)}
                    onValueChange={onUpdateAmount}
                />
                <Select
                    label="Категория"
                    selectedKeys={row.categoryId ? [row.categoryId] : []}
                    onSelectionChange={onUpdateCategory}
                >
                    {categoryStore.categories.map((cat) => (
                        <SelectItem key={String(cat.id)} textValue={cat.name}>
                            {cat.name}
                        </SelectItem>
                    ))}
                </Select>
                <Input
                    type="datetime-local"
                    label="Дата"
                    value={row.createdAt}
                    onValueChange={onUpdateCreated}
                />
            </div>

            <div className="rounded-lg bg-default-100 p-3">
                <p className="text-xs text-default-500 mb-2">Сырой текст (origin)</p>
                <pre className="whitespace-pre-wrap break-words text-sm">
                    {row.origin}
                </pre>
            </div>
        </div>
    )
});

interface IPreviewProps {
    onClose(): void;
}

const Preview = observer((props: IPreviewProps) => {

    const { workspace, operation: operationStore } = useRootStore();
    const store = useImportStore();

    const workspaceId = workspace.activeWorkspace?.id;

    const selectAll = useCallback(() => {
        store.selectAll();
    }, [store]);

    const unselectAll = useCallback(() => {
        store.unselectAll();
    }, [store]);

    const onSave = useCallback(async () => {
        if (!workspaceId) {
            return;
        }
        try {
            await store.save(workspaceId);
        } catch(error) {
            console.error(error);
            return;
        }
        await operationStore.reload();
        props.onClose();
    }, [workspaceId]);

    return (
        <>
            <ModalHeader>
                Распознанные операции ({store.selectedCount}/{store.items.length})
            </ModalHeader>
            <ModalBody className={FORM_MODAL_BODY_CLASS}>
                {store.validateError && (
                    <p className="text-sm text-danger" role="alert">
                        {store.validateError}
                    </p>
                )}
                <>
                    {!!store.items.length && (
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="flat" onPress={selectAll}>
                                Выбрать все
                            </Button>
                            <Button size="sm" variant="flat" onPress={unselectAll}>
                                Снять все
                            </Button>
                        </div>
                    )}
                    {!store.items.length && (
                        <p className="text-sm text-default-500">Нет данных для сохранения</p>
                    )}
                    {store.items.map((row) => (
                        <PreviewRow key={row.localId} row={row} />
                    ))}
                </>
            </ModalBody>
            <ModalFooter>
                <Button variant="light" onPress={props.onClose}>
                    Закрыть
                </Button>
                <Button
                    color="primary"
                    isLoading={store.inProgress}
                    isDisabled={!store.items.length}
                    onPress={onSave}>
                    Сохранить выбранные
                </Button>
            </ModalFooter>
        </>
    )
})

export default Preview;
