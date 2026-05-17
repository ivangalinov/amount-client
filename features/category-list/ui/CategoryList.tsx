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
import { Chip } from "@heroui/chip";
import { useRootStore } from "@/shared/store/root-store";
import {
  MobileDataList,
  MobileDataListItem,
  MobileDataListState,
} from "@/shared/ui/mobile-data-list";
import { FloatingActionButton } from "@/shared/ui/floating-action-button";
import { DesktopOnly, MobileOnly } from "@/shared/ui/viewport-only";
import { CategoryFormModal } from "@/features/category-form";
import type { ICategory } from "@/entities/category/model/types";
import { CategoryType } from "@/entities/category/model/types";

const typeLabel = (type: CategoryType) =>
  type === CategoryType.Income ? "Доход" : "Расход";

interface ICategoryRowActionsProps {
  cat: ICategory;
  onEdit: (cat: ICategory) => void;
  onDelete: (cat: ICategory) => void;
}

function CategoryRowActions({ cat, onEdit, onDelete }: ICategoryRowActionsProps) {
  return (
    <>
      <Button size="sm" variant="flat" onPress={() => onEdit(cat)}>
        Изменить
      </Button>
      <Button
        color="danger"
        size="sm"
        variant="flat"
        onPress={() => onDelete(cat)}
      >
        Удалить
      </Button>
    </>
  );
}

function CategoryColorSwatch({ color }: { color: string }) {
  return (
    <span
      className="h-4 w-4 shrink-0 rounded-full border border-default-200"
      style={{ backgroundColor: color }}
    />
  );
}

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
          <DesktopOnly contentsOnDesktop>
            <Button color="primary" onPress={openCreate}>
              Добавить категорию
            </Button>
          </DesktopOnly>
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
          <DesktopOnly>
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
                        <CategoryColorSwatch color={cat.color} />
                        <span className="text-default-500 text-sm">
                          {cat.color}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>{cat.limit ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <CategoryRowActions
                          cat={cat}
                          onDelete={handleDelete}
                          onEdit={openEdit}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DesktopOnly>

          <MobileOnly>
            {categoryStore.loading && categoryStore.categories.length === 0 ? (
              <MobileDataListState>
                <span className="inline-flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  Загрузка категорий…
                </span>
              </MobileDataListState>
            ) : null}

            {!categoryStore.loading && categoryStore.categories.length === 0 ? (
              <MobileDataListState>
                Категорий пока нет. Добавьте первую.
              </MobileDataListState>
            ) : null}

            {categoryStore.categories.length > 0 ? (
              <MobileDataList aria-label="Список категорий">
                {categoryStore.categories.map((cat) => (
                  <MobileDataListItem
                    key={cat.id}
                    description={`Лимит: ${cat.limit ?? "—"}`}
                    footer={
                      <CategoryRowActions
                        cat={cat}
                        onDelete={handleDelete}
                        onEdit={openEdit}
                      />
                    }
                    title={
                      <span className="inline-flex items-center gap-2">
                        <CategoryColorSwatch color={cat.color} />
                        {cat.name}
                      </span>
                    }
                    trailing={
                      <Chip
                        size="sm"
                        variant="flat"
                        color={
                          cat.type === CategoryType.Income ? "success" : "warning"
                        }
                      >
                        {typeLabel(cat.type)}
                      </Chip>
                    }
                  />
                ))}
              </MobileDataList>
            ) : null}
          </MobileOnly>
        </Card>
      </section>

      <FloatingActionButton
        aria-label="Добавить категорию"
        onPress={openCreate}
      />

      <CategoryFormModal
        isOpen={modalOpen}
        editCategory={editingCategory}
        onClose={closeModal}
      />
    </>
  );
});
