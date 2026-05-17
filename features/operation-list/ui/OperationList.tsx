"use client";

import { useEffect, useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow
} from "@heroui/table";
import { Card } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { useRootStore } from "@/shared/store/root-store";
import { OperationFormModal } from "@/features/operation-form";
import { DateRangeFilter } from "@/shared/ui/DateRangeFilter";
import { getDefaultDateFrom, getDefaultDateTo } from "@/shared/lib/date";
import type { IOperation } from "@/entities/operation/model/types";
import { AuthorDropdown } from "@/features/author-dropdown";
import { CategoryFilter } from "@/features/category-filter";
import { ButtonImport } from '@/features/import-action';
import { Chip } from "@heroui/chip";
import { CategoryType } from '@/entities/category';

const CATEGORY_TYPES = {
  [CategoryType.Expense]: 'Расход',
  [CategoryType.Income]: 'Доход'
} as const;

interface IOperationTypeFilterProps {
  selectedKey: CategoryType | null;
  onSelectedKeyChanged(selectedKey: CategoryType | null): void;
}

function OperationTypeFilter(props: IOperationTypeFilterProps) {

  return (
    <div className="flex gap-x-2">
      <Chip 
        className="cursor-pointer"
        variant="flat" 
        color={!props.selectedKey ? 'primary' : 'default'}
        onClick={() => props.onSelectedKeyChanged(null)}> 
          Все
        </Chip>
      { Object.values(CategoryType).filter((type) => (
        //@ts-expect-error
          !!CATEGORY_TYPES[type]
      )).map((type) => (
        <Chip 
          key={type}
          variant="flat"
          color={props.selectedKey === type ? 'primary' : 'default'}
          className="cursor-pointer"
          onClick={() => props.onSelectedKeyChanged(type)}>
              {/* @ts-expect-error */}
            {CATEGORY_TYPES[type]}
          </Chip>
      )) }
    </div>
  )
}

export const OperationList = observer(function OperationList() {
  const { workspace, operation } = useRootStore();

  const [dateFrom, setDateFrom] = useState(() => getDefaultDateFrom());
  const [dateTo, setDateTo] = useState(() => getDefaultDateTo());
  const [categoryId, setCategoryId] = useState<string>("");
  const [authorId, setAuthorId] = useState<number | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<IOperation | null>(
    null
  );

  const [operationType, setOperationType] = useState<CategoryType | null>(null);

  useEffect(() => {
    void workspace.loadWorkspaces();
  }, []);

  const activeWorkspace = workspace.activeWorkspace;

  useEffect(() => {
    if (!activeWorkspace) return;
    const params: {
      workspaceId?: number;
    } = {
      workspaceId: activeWorkspace.id
    };
    void operation.load({
      filter: {
        ...params
      },
      navigation: {
        limit: 30,
        page: 0
      }
    });
  }, [
    activeWorkspace?.id
  ]);

  const openCreate = () => {
    setEditingOperation(null);
    setModalOpen(true);
  };

  const openEdit = (op: IOperation) => {
    setEditingOperation(op);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingOperation(null);
  };

  const handleDelete = async (op: IOperation) => {
    if (!window.confirm(`Удалить операцию «${op.title}»?`)) return;
    await operation.delete(op.id);
  };

  const onSelectedTypeChanged = useCallback((selectedKey: CategoryType) => {
    operation.updateFilter({ type: selectedKey });
    setOperationType(selectedKey);
  }, []);

  const onAutorChanged = useCallback((authorId: number) => {
    setAuthorId(authorId);
    operation.updateFilter({
      userId: authorId
    });
  }, []);

  const onCategoryChange = useCallback((categoryId: string) => {
    setCategoryId(categoryId);
    operation.updateFilter({
      categoryId: categoryId ? categoryId as unknown as number : undefined
    });
  }, []);

  const onPeriodChange = useCallback((from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    if (from) from = new Date(from).toISOString();
    if (to) {
      const d = new Date(to);
      d.setHours(23, 59, 59, 999);
      to = d.toISOString();
    }
    operation.updateFilter({
      dateFrom: from,
      dateTo: to
    })
  }, []);

  const onLoadMore = useCallback(() => {
    operation.nextPage();
  }, [operation]);

  return (
    <>
      <section className="flex flex-col gap-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold">Операции</h1>
          <div className="flex gap-3">
            <ButtonImport />
            <Button color="primary" onPress={openCreate}>
              Добавить операцию
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <AuthorDropdown
              selectedUserId={authorId}
              onAuthorChange={onAutorChanged}
            />
            <CategoryFilter
              selectedCategoryId={categoryId}
              onCategoryChange={onCategoryChange}
            />
            <DateRangeFilter
              dateFrom={dateFrom}
              dateTo={dateTo}
              onPeriodChange={onPeriodChange}
            />
          </div>
        </Card>

        <Card className="p-4">
          <OperationTypeFilter selectedKey={operationType} onSelectedKeyChanged={onSelectedTypeChanged} />
        </Card>

        {operation.error && (
          <Card className="p-3 text-sm text-danger">{operation.error}</Card>
        )}

        <Card className="p-2">
          <Table
            isHeaderSticky
            bottomContent={
              operation.hasMore && (
                <div className="flex w-full justify-center">
                  <Button variant="light" onPress={onLoadMore}>Ещё</Button>
                </div>
              )
            }
            classNames={{
              base: "max-h-[520px] overflow-scroll",
              table: "min-h-[420px]",
            }}
            aria-label="Список операций">
            <TableHeader>
              <TableColumn>Дата</TableColumn>
              <TableColumn>Название</TableColumn>
              <TableColumn>Категория</TableColumn>
              <TableColumn>Автор</TableColumn>
              <TableColumn align="end">Сумма</TableColumn>
              <TableColumn width={120} align="center">
                Действия
              </TableColumn>
            </TableHeader>
            <TableBody isLoading={operation.loading} loadingContent={
              <div className="flex items-center gap-2 text-default-500">
                <Spinner size="sm" />
                <span>Загрузка операций…</span>
              </div>
            }
              emptyContent="Операций пока нет">
              {operation.items.map((op) => {
                return (
                  <TableRow key={op.id}>
                    <TableCell>
                      {new Date(op.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{op.title}</TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1.5"
                        style={{ color: op.categoryColor }}
                      >
                        {op.categoryId ? (
                          <>
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: op.categoryColor }}
                            />
                            {op.categoryName}
                          </>
                        ) : (
                          "—"
                        )}
                      </span>
                    </TableCell>
                    <TableCell>{op.userName}</TableCell>
                    <TableCell
                      className={
                        op.amount < 0 ? "text-danger" : "text-success"
                      }
                    >
                      {op.amount > 0 ? "+" : ""}
                      {op.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => openEdit(op)}
                        >
                          Изменить
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          onPress={() => handleDelete(op)}
                        >
                          Удалить
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </section>

      <OperationFormModal
        isOpen={modalOpen}
        editOperation={editingOperation}
        onClose={closeModal}
      />
    </>
  );
});
