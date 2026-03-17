"use client";

import { useEffect, useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Card } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { useRootStore } from "@/shared/store/root-store";
import { OperationFormModal } from "@/features/operation-form";
import { DateRangeFilter } from "@/shared/ui/DateRangeFilter";
import { getDefaultDateFrom, getDefaultDateTo } from "@/shared/lib/date";
import type { Operation } from "@/entities/operation/model/types";
import { AuthorDropdown } from "@/features/author-dropdown";
import { CategoryFilter } from "@/features/category-filter";

export const OperationList = observer(function OperationList() {
  const { user, workspace, category: categoryStore, operation } = useRootStore();

  const [dateFrom, setDateFrom] = useState(() => getDefaultDateFrom());
  const [dateTo, setDateTo] = useState(() => getDefaultDateTo());
  const [categoryId, setCategoryId] = useState<string>("");
  const [authorId, setAuthorId] = useState<number | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(
    null
  );

  const loadData = useCallback(() => {
    void user.loadCurrentUser();
    void workspace.loadWorkspaces();
  }, [user, workspace]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeWorkspace = workspace.activeWorkspace;

  useEffect(() => {
    const userIds = [...new Set(operation.operations.map((op) => op.userId))];
    userIds.forEach((id) => void user.loadUserById(id));
  }, [operation.operations, user]);

  useEffect(() => {
    if (!activeWorkspace) return;
    const params: {
      workspaceId?: number;
      userId?: number;
      dateFrom?: string;
      dateTo?: string;
      categoryId?: number;
    } = { workspaceId: activeWorkspace.id };
    if (authorId !== "") params.userId = authorId;
    if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString();
    if (dateTo) {
      const d = new Date(dateTo);
      d.setHours(23, 59, 59, 999);
      params.dateTo = d.toISOString();
    }
    if (categoryId) params.categoryId = Number(categoryId);
    void operation.loadOperations(params);
  }, [activeWorkspace?.id, authorId, dateFrom, dateTo, categoryId, operation]);

  const openCreate = () => {
    setEditingOperation(null);
    setModalOpen(true);
  };

  const openEdit = (op: Operation) => {
    setEditingOperation(op);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingOperation(null);
  };

  const handleDelete = async (op: Operation) => {
    if (!window.confirm(`Удалить операцию «${op.title}»?`)) return;
    await operation.deleteOperation(op.id);
  };

  return (
    <>
      <section className="flex flex-col gap-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold">Операции</h1>
          <Button color="primary" onPress={openCreate}>
            Добавить операцию
          </Button>
        </div>

        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <AuthorDropdown
              selectedUserId={authorId}
              onAuthorChange={setAuthorId}
            />
            <CategoryFilter
              selectedCategoryId={categoryId}
              onCategoryChange={setCategoryId}
            />
            <DateRangeFilter
              dateFrom={dateFrom}
              dateTo={dateTo}
              onPeriodChange={(from, to) => {
                setDateFrom(from);
                setDateTo(to);
              }}
            />
          </div>
        </Card>

        {operation.loading && operation.operations.length === 0 && (
          <div className="flex items-center gap-2 text-default-500">
            <Spinner size="sm" />
            <span>Загрузка операций…</span>
          </div>
        )}

        {operation.error && (
          <Card className="p-3 text-sm text-danger">{operation.error}</Card>
        )}

        <Card className="p-2">
          <Table aria-label="Список операций">
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
            <TableBody emptyContent="Операций пока нет">
              {operation.operations.map((op) => {
                const cat = categoryStore.categoriesById.get(op.categoryId);
                return (
                  <TableRow key={op.id}>
                    <TableCell>
                      {new Date(op.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{op.title}</TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1.5"
                        style={{ color: cat?.color }}
                      >
                        {cat ? (
                          <>
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </>
                        ) : (
                          "—"
                        )}
                      </span>
                    </TableCell>
                    <TableCell>{user.getAuthorName(op.userId)}</TableCell>
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
        onClose={closeModal}
        editOperation={editingOperation}
      />
    </>
  );
});
