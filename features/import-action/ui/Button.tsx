"use client";

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Radio, RadioGroup } from "@heroui/radio";
import { CategoryType } from "@/entities/category/model/types";
import type {
  IOperationImportRow,
  OperationImportSource,
} from "@/entities/operation/api/types";
import { FileManager } from "@/shared/file";
import { useRootStore } from "@/shared/store/root-store";

import StoreProvider from './StoreProvider';
import { useImportStore } from "../model/store";

const fileManager = new FileManager();

interface IEditableImportRow extends IOperationImportRow {
  localId: string;
  selected: boolean;
  categoryId: string;
  createdAt: string;
  title: string;
}

const SOURCE_LABELS: Record<OperationImportSource, string> = {
  sber: "Сбер",
  tinkoff: "Тинькофф",
};

const TYPE_LABELS: Record<CategoryType, string> = {
  expense: "Расход",
  income: "Доход",
  transfer: "Перевод",
};

const ActionImport = observer(function ActionImport() {
  const { workspace, category: categoryStore, operation: operationStore } = useRootStore();
  const activeWorkspace = workspace.activeWorkspace;

  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [source, setSource] = useState<OperationImportSource>("sber");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<IEditableImportRow[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const store = useImportStore();

  console.info('store.inProgress', store.inProgress);

  useEffect(() => {
    if (!activeWorkspace) {
      return;
    }
    void categoryStore.loadCategories({ workspaceId: activeWorkspace.id });
  }, [activeWorkspace?.id, categoryStore]);


  const selectFile = async () => {
    const files = await fileManager.select();
    if (!files.length) {
      return;
    }
    setFile(files[0]);
  };

  const handleImport = async () => {
    if (!file) {
        return;
    }
    await store.parseFile(file, source);
    setSourceModalOpen(false);
    setPreviewModalOpen(true);
  };

  const updateRow = (localId: string, patch: Partial<IEditableImportRow>) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.localId === localId ? { ...row, ...patch } : row,
      ),
    );
  };

  const selectAllRows = () => {
    store.selectAll();
  };

  const unselectAllRows = () => {
    store.unselectAll();
  };

  const validateBeforeSave = (): string | null => {
    if (!activeWorkspace) {
      return "Сначала выберите рабочее пространство";
    }
    if (!store.selectedCount) {
      return "Выберите хотя бы одну запись для сохранения";
    }
    for (const row of rows) {
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
    return null;
  };

  const handleSave = async () => {
    const validationError = validateBeforeSave();
    if (validationError) {
      setSaveError(validationError);
      return;
    }
    if (!activeWorkspace) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      for (const row of rows) {
        if (!row.selected) {
          continue;
        }
        await operationStore.createOperation({
          amount: Number(row.amount),
          categoryId: Number(row.categoryId),
          title: row.title.trim(),
          workspaceId: activeWorkspace.id,
          createdAt: new Date(row.createdAt).toISOString(),
          extKey: row.ext_key,
          extSource: row.ext_source || source,
        });
      }
      setPreviewModalOpen(false);
      setRows([]);
      setFile(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button color="primary" onPress={() => setSourceModalOpen(true)}>
        Импорт
      </Button>

      <Modal
        isOpen={sourceModalOpen}
        onOpenChange={(open) => {
          setSourceModalOpen(open);
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Импорт операций</ModalHeader>
              <ModalBody className="gap-4">
                {store.importError && (
                  <p className="text-sm text-danger" role="alert">
                    {store.importError}
                  </p>
                )}
                <RadioGroup
                  label="Источник"
                  value={source}
                  onValueChange={(value) => setSource(value as OperationImportSource)}
                >
                  <Radio value="sber">Сбер</Radio>
                  <Radio value="tinkoff">Тинькофф</Radio>
                </RadioGroup>

                <div className="flex items-center gap-3">
                  <Button variant="flat" onPress={selectFile}>
                    Выбрать файл
                  </Button>
                  <span className="text-sm text-default-500">
                    {file?.name ?? "Файл не выбран"}
                  </span>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Отмена
                </Button>
                {`${store.inProgress}`}
                <Button color="primary" isLoading={store.inProgress} onPress={handleImport}>
                  Загрузить
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={previewModalOpen}
        size="5xl"
        onOpenChange={(open) => {
          setPreviewModalOpen(open);
          if (!open) {
            setSaveError(null);
          }
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                Распознанные операции ({store.selectedCount}/{store.items.length})
              </ModalHeader>
              <ModalBody className="max-h-[70vh] overflow-y-auto gap-4">
                {!!rows.length && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="flat" onPress={selectAllRows}>
                      Выбрать все
                    </Button>
                    <Button size="sm" variant="flat" onPress={unselectAllRows}>
                      Снять все
                    </Button>
                  </div>
                )}
                {saveError && (
                  <p className="text-sm text-danger" role="alert">
                    {saveError}
                  </p>
                )}
                {!store.items.length && (
                  <p className="text-sm text-default-500">Нет данных для сохранения</p>
                )}
                {store.items.map((row) => (
                  <div
                    key={row.localId}
                    className="rounded-xl border border-default-200 p-4 flex flex-col gap-3"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-2 text-sm">
                        {row.selected.toString()}
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={() =>
                            store.toggleSelection(row.localId)
                          }
                        />
                        Сохранить
                      </label>
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
                        onValueChange={(value) => updateRow(row.localId, { title: value })}
                      />
                      <Input
                        type="number"
                        label="Сумма"
                        value={String(row.amount)}
                        onValueChange={(value) => {
                          const parsed = Number(value);
                          if (Number.isNaN(parsed)) {
                            return;
                          }
                          updateRow(row.localId, { amount: parsed });
                        }}
                      />
                      <Select
                        label="Категория"
                        selectedKeys={row.categoryId ? [row.categoryId] : []}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0];
                          updateRow(row.localId, {
                            categoryId: value != null ? String(value) : "",
                          });
                        }}
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
                        onValueChange={(value) => updateRow(row.localId, { createdAt: value })}
                      />
                    </div>

                    <div className="rounded-lg bg-default-100 p-3">
                      <p className="text-xs text-default-500 mb-2">Сырой текст (origin)</p>
                      <pre className="whitespace-pre-wrap break-words text-sm">
                        {row.origin}
                      </pre>
                    </div>
                  </div>
                ))}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Закрыть
                </Button>
                <Button
                  color="primary"
                  isLoading={saving}
                  isDisabled={!rows.length}
                  onPress={handleSave}
                >
                  Сохранить выбранные
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
});



export default function _ActionImport() {
    return (
        <StoreProvider>
            <ActionImport />
        </StoreProvider>
    );
}
