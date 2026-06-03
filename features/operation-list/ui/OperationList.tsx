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
import {
  MobileDataList,
  MobileDataListItem,
  MobileDataListState,
} from "@/shared/ui/mobile-data-list";
import { FloatingActionButton } from "@/shared/ui/floating-action-button";
import { DesktopOnly, MobileOnly } from "@/shared/ui/viewport-only";
import clsx from 'clsx';

const CATEGORY_TYPES = {
  [CategoryType.Expense]: 'Расход',
  [CategoryType.Income]: 'Доход'
} as const;

interface IOperationTypeFilterProps {
  selectedKey: CategoryType | null;
  onSelectedKeyChanged(selectedKey: CategoryType | null): void;
}

function formatOperationDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatOperationAmount(amount: number): string {
  return `${amount > 0 ? "+" : ""}${amount.toFixed(2)}`;
}

function OperationCategoryLabel({ op }: { op: IOperation }) {
  if (!op.categoryId) {
    return <span className="text-default-400">—</span>;
  }

  return (
    <span
      className="inline-flex items-center gap-1.5"
      style={{ color: op.categoryColor }}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: op.categoryColor }}
      />
      {op.categoryName}
    </span>
  );
}

interface IOperationRowActionsProps {
  op: IOperation;
  onEdit: (op: IOperation) => void;
  onDelete: (op: IOperation) => void;
}

function OperationRowActions({ op, onEdit, onDelete }: IOperationRowActionsProps) {
  return (
    <>
      <Button size="sm" variant="flat" onPress={() => onEdit(op)}>
        Изменить
      </Button>
      <Button
        color="danger"
        size="sm"
        variant="flat"
        onPress={() => onDelete(op)}
      >
        Удалить
      </Button>
    </>
  );
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

  const onAutorChanged = useCallback((authorId: number | "") => {
    setAuthorId(authorId);
    operation.updateFilter({
      userId: authorId === "" ? undefined : authorId,
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
            <DesktopOnly contentsOnDesktop>
              <Button color="primary" onPress={openCreate}>
                Добавить операцию
              </Button>
            </DesktopOnly>
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
          <DesktopOnly>
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
                      <OperationCategoryLabel op={op} />
                    </TableCell>
                    <TableCell>{op.userName}</TableCell>
                    <TableCell
                      className={
                        op.amount < 0 ? "text-danger" : "text-success"
                      }
                    >
                      {formatOperationAmount(op.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <OperationRowActions
                          op={op}
                          onDelete={handleDelete}
                          onEdit={openEdit}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </DesktopOnly>

          <MobileOnly>
            {operation.loading && operation.items.length === 0 ? (
              <MobileDataListState>
                <span className="inline-flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  Загрузка операций…
                </span>
              </MobileDataListState>
            ) : null}

            {!operation.loading && operation.items.length === 0 ? (
              <MobileDataListState>Операций пока нет</MobileDataListState>
            ) : null}

            {operation.items.length > 0 ? (
              <MobileDataList aria-label="Список операций">
                {operation.items.map((op) => (
                  <MobileDataListItem
                    key={op.id}
                    description={
                      <span className="flex flex-col gap-1">
                        <span>{formatOperationDate(op.createdAt)}</span>
                        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                          <OperationCategoryLabel op={op} />
                          <span className="text-default-400">·</span>
                          <span>{op.userName}</span>
                        </span>
                      </span>
                    }
                    footer={
                      <OperationRowActions
                        op={op}
                        onDelete={handleDelete}
                        onEdit={openEdit}
                      />
                    }
                    title={op.title}
                    trailing={
                      <span
                        className={clsx(
                          "font-semibold tabular-nums",
                          op.amount < 0 ? "text-danger" : "text-success",
                        )}
                      >
                        {formatOperationAmount(op.amount)}
                      </span>
                    }
                  />
                ))}
              </MobileDataList>
            ) : null}

            {operation.hasMore ? (
              <div className="flex justify-center border-t border-divider px-3 py-3">
                <Button variant="light" onPress={onLoadMore}>
                  Ещё
                </Button>
              </div>
            ) : null}
          </MobileOnly>
        </Card>
      </section>

      <FloatingActionButton
        aria-label="Добавить операцию"
        onPress={openCreate}
      />

      <OperationFormModal
        isOpen={modalOpen}
        editOperation={editingOperation}
        onClose={closeModal}
      />
    </>
  );
});
