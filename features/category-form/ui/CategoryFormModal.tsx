"use client";

import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { useRootStore } from "@/shared/store/root-store";
import type { ICategory } from "@/entities/category/model/types";
import { CategoryType } from "@/entities/category/model/types";

interface ICategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editCategory: ICategory | null;
}

const TYPE_OPTIONS = [
  { value: CategoryType.Expense, label: "Расход" },
  { value: CategoryType.Income, label: "Доход" },
];

const CategoryFormModal = observer(function CategoryFormModal({
  isOpen,
  onClose,
  editCategory,
}: ICategoryFormModalProps) {
  const { user, workspace, category: categoryStore } = useRootStore();

  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>(CategoryType.Expense);
  const [color, setColor] = useState("#6366f1");
  const [limit, setLimit] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const isEdit = editCategory != null;

  useEffect(() => {
    if (!isOpen) return;
    if (editCategory) {
      setName(editCategory.name);
      setType(editCategory.type);
      setColor(editCategory.color || "#6366f1");
      setLimit(editCategory.limit ?? "");
    } else {
      setName("");
      setType(CategoryType.Expense);
      setColor("#6366f1");
      setLimit("");
    }
    setError(null);
    setNameError(null);
  }, [isOpen, editCategory]);

  const currentUser = user.currentUser;
  const activeWorkspace = workspace.activeWorkspace;

  const handleSubmit = async () => {
    setError(null);
    setNameError(null);
    if (!name.trim()) {
      setNameError("Введите название категории");
      return;
    }
    if (!currentUser || !activeWorkspace) {
      setError("Сначала загрузите пользователя и рабочее пространство");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && editCategory) {
        await categoryStore.updateCategory({
          id: editCategory.id,
          name: name.trim(),
          type,
          color: color.trim() || undefined,
          limit: limit.trim() || undefined,
        });
      } else {
        await categoryStore.createCategory({
          name: name.trim(),
          workspaceId: activeWorkspace.id,
          type,
          userId: currentUser.id,
          color: color.trim() || "#6366f1",
          limit: limit.trim() || undefined,
        });
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader>
              {isEdit ? "Редактировать категорию" : "Новая категория"}
            </ModalHeader>
            <ModalBody className="gap-4">
              {error && (
                <p className="text-sm text-danger" role="alert">
                  {error}
                </p>
              )}
              <Input
                label="Название"
                placeholder="Например: Продукты"
                value={name}
                onValueChange={(value) => {
                  setName(value);
                  if (nameError) setNameError(null);
                }}
                isInvalid={!!nameError}
                errorMessage={nameError}
                autoFocus
              />
              <Select
                label="Тип"
                selectedKeys={[type]}
                onSelectionChange={(keys) => {
                  const v = Array.from(keys)[0] as CategoryType | undefined;
                  if (v) setType(v);
                }}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} textValue={opt.label}>
                    {opt.label}
                  </SelectItem>
                ))}
              </Select>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-foreground-500">Цвет</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-default-200"
                  />
                  <Input
                    placeholder="#6366f1"
                    value={color}
                    onValueChange={setColor}
                    classNames={{ base: "flex-1" }}
                  />
                </div>
              </div>
              <Input
                label="Лимит (опционально)"
                placeholder="Сумма или описание"
                value={limit}
                onValueChange={setLimit}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Отмена
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={submitting}
              >
                {isEdit ? "Сохранить" : "Добавить"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
});

export { CategoryFormModal };
