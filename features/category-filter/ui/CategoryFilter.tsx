"use client";

import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useRootStore } from "@/shared/store/root-store";
import { CategoryFilter as CategoryFilterUI } from "@/shared/ui/CategoryFilter";

export interface ICategoryFilterProps {
  /** Выбранная категория (пустая строка = все категории) */
  selectedCategoryId: string;
  /** Обработчик смены категории */
  onCategoryChange: (categoryId: string) => void;
  /** Подпись поля */
  label?: string;
  /** Плейсхолдер при отсутствии выбора */
  placeholder?: string;
  /** Дополнительные классы для контейнера */
  classNames?: { base?: string };
}

export const CategoryFilter = observer(function CategoryFilter({
  selectedCategoryId,
  onCategoryChange,
  label,
  placeholder,
  classNames,
}: ICategoryFilterProps) {
  const { workspace, category: categoryStore } = useRootStore();
  const activeWorkspace = workspace.activeWorkspace;

  useEffect(() => {
    if (!activeWorkspace) return;
    void categoryStore.loadCategories({ workspaceId: activeWorkspace.id });
  }, [activeWorkspace?.id, categoryStore]);

  return (
    <CategoryFilterUI
      categories={categoryStore.categories}
      selectedCategoryId={selectedCategoryId}
      label={label}
      placeholder={placeholder}
      classNames={classNames}
      onCategoryChange={onCategoryChange}
    />
  );
});
