"use client";

import { Select, SelectItem } from "@heroui/select";
import type { Category } from "@/entities/category/model/types";

export interface CategoryFilterProps {
  /** Список категорий для выбора */
  categories: Category[];
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

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onCategoryChange,
  label = "Категория",
  placeholder = "Все категории",
  classNames,
}: CategoryFilterProps) {
  return (
    <Select
      label={label}
      placeholder={placeholder}
      selectedKeys={selectedCategoryId ? [selectedCategoryId] : []}
      onSelectionChange={(keys) => {
        const v = Array.from(keys)[0];
        onCategoryChange(v != null ? String(v) : "");
      }}
      classNames={classNames ?? { base: "max-w-[200px]" }}
    >
      {categories.map((cat) => (
        <SelectItem key={String(cat.id)} textValue={cat.name}>
          <span className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            {cat.name}
          </span>
        </SelectItem>
      ))}
    </Select>
  );
}
