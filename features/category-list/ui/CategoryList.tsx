"use client";

import { useEffect, useState } from "react";
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
import { CategoryFormModal } from "@/features/category-form";
import type { ICategory } from "@/entities/category/model/types";
import { CategoryType } from "@/entities/category/model/types";

const typeLabel = (type: CategoryType) =>
  type === CategoryType.Income ? "Доход" : "Расход";

export const CategoryList = observer(function CategoryList() {
  const { workspace, category: categoryStore } = useRootStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);

  useEffect(() => {
    void workspace.loadWorkspaces();
  }, [workspace]);

  const activeWorkspace = workspace.activeWorkspace;

  useEffect(() => {
    if (!activeWorkspace) return;
    void categoryStore.loadCategories({ workspaceId: activeWorkspace.id });
  }, [activeWorkspace?.id, categoryStore]);

  const openCreate = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const openEdit = (cat: ICategory) => {
    setEditingCategory(cat);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
  };

  const handleDelete = async (cat: ICategory) => {
    if (!window.confirm(`Удалить категорию «${cat.name}»?`)) return;
    await categoryStore.deleteCategory(cat.id);
  };

  return (
    <>
      <section className="flex flex-col gap-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Категории</h1>
          <Button color="primary" onPress={openCreate}>
            Добавить категорию
          </Button>
        </div>

        {categoryStore.loading && categoryStore.categories.length === 0 && (
          <div className="flex items-center gap-2 text-default-500">
            <Spinner size="sm" />
            <span>Загрузка категорий…</span>
          </div>
        )}

        {categoryStore.error && (
          <Card className="p-3 text-sm text-danger">
            {categoryStore.error}
          </Card>
        )}

        <Card className="p-2">
          <Table aria-label="Список категорий">
            <TableHeader>
              <TableColumn>Название</TableColumn>
              <TableColumn>Тип</TableColumn>
              <TableColumn>Цвет</TableColumn>
              <TableColumn>Лимит</TableColumn>
              <TableColumn width={160} align="center">
                Действия
              </TableColumn>
            </TableHeader>
            <TableBody emptyContent="Категорий пока нет. Добавьте первую.">
              {categoryStore.categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>{typeLabel(cat.type)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full shrink-0 border border-default-200"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-default-500 text-sm">
                        {cat.color}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>{cat.limit ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => openEdit(cat)}
                      >
                        Изменить
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        onPress={() => handleDelete(cat)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <CategoryFormModal
        isOpen={modalOpen}
        onClose={closeModal}
        editCategory={editingCategory}
      />
    </>
  );
});
