"use client";

import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { usePrefersFinePointer } from "@/shared/lib/use-prefers-fine-pointer";
import { useRootStore } from "@/shared/store/root-store";
import { FORM_MODAL_BODY_CLASS, FormModal } from "@/shared/ui/form-modal";
import type { IOperation } from "@/entities/operation/model/types";
import type { ICategory } from "@/entities/category/model/types";

interface IOperationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editOperation: IOperation | null;
}

const OperationFormModal = observer(function OperationFormModal({
  isOpen,
  onClose,
  editOperation,
}: IOperationFormModalProps) {
  const { user, workspace, category: categoryStore, operation: operationStore } =
    useRootStore();

  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [createdAt, setCreatedAt] = useState(() =>
    new Date().toISOString().slice(0, 16)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const isEdit = editOperation != null;
  const prefersFinePointer = usePrefersFinePointer();
  const categories: ICategory[] = categoryStore.categories;

  useEffect(() => {
    if (!isOpen) return;
    if (editOperation) {
      setAmount(String(editOperation.amount));
      setTitle(editOperation.title);
      setCategoryId(String(editOperation.categoryId));
      setCreatedAt(
        new Date(editOperation.createdAt).toISOString().slice(0, 16)
      );
    } else {
      setAmount("");
      setTitle("");
      setCategoryId("");
      setCreatedAt(new Date().toISOString().slice(0, 16));
    }
    setError(null);
    setAmountError(null);
    setTitleError(null);
    setCategoryError(null);
  }, [isOpen, editOperation]);

  const currentUser = user.currentUser;
  const activeWorkspace = workspace.activeWorkspace;

  const handleSubmit = async () => {
    setError(null);
    setAmountError(null);
    setTitleError(null);
    setCategoryError(null);

    const numAmount = Number.parseFloat(amount);
    let hasValidationError = false;

    if (Number.isNaN(numAmount)) {
      setAmountError("Введите корректную сумму");
      hasValidationError = true;
    }
    if (!title.trim()) {
      setTitleError("Введите название");
      hasValidationError = true;
    }
    const catId = Number(categoryId);
    if (!catId) {
      setCategoryError("Выберите категорию");
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }
    if (!currentUser || !activeWorkspace) {
      setError("Сначала загрузите пользователя и рабочее пространство");
      return;
    }

    setSubmitting(true);
    try {
      const dateStr = new Date(createdAt).toISOString();
      if (isEdit && editOperation) {
        await operationStore.update({
          id: editOperation.id,
          amount: numAmount,
          title: title.trim(),
          categoryId: catId,
          createdAt: dateStr,
        });
      } else {
        await operationStore.create({
          amount: numAmount,
          title: title.trim(),
          categoryId: catId,
          workspaceId: activeWorkspace.id,
          createdAt: dateStr,
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
    <FormModal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent>
        {(onCloseModal) => (
          <>
            <ModalHeader>
              {isEdit ? "Редактировать операцию" : "Новая операция"}
            </ModalHeader>
            <ModalBody className={FORM_MODAL_BODY_CLASS}>
              {error && (
                <p className="text-sm text-danger" role="alert">
                  {error}
                </p>
              )}
              <Input
                autoFocus={prefersFinePointer}
                type="number"
                label="Сумма"
                placeholder="например -500 или 1000"
                value={amount}
                isInvalid={!!amountError}
                errorMessage={amountError}
                onValueChange={(value) => {
                  setAmount(value);
                  if (amountError) setAmountError(null);
                }}
              />
              <Input
                label="Название"
                placeholder="Описание операции"
                value={title}
                isInvalid={!!titleError}
                errorMessage={titleError}
                onValueChange={(value) => {
                  setTitle(value);
                  if (titleError) setTitleError(null);
                }}
              />
              <Select
                label="Категория"
                placeholder="Выберите категорию"
                selectedKeys={categoryId ? [categoryId] : []}
                isInvalid={!!categoryError}
                errorMessage={categoryError}
                onSelectionChange={(keys) => {
                  const v = Array.from(keys)[0];
                  setCategoryId(v != null ? String(v) : "");
                }}
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
              <Input
                type="datetime-local"
                label="Дата и время"
                value={createdAt}
                onValueChange={setCreatedAt}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onCloseModal}>
                Отмена
              </Button>
              <Button
                color="primary"
                isLoading={submitting}
                onPress={handleSubmit}
              >
                {isEdit ? "Сохранить" : "Добавить"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </FormModal>
  );
});

export { OperationFormModal };
