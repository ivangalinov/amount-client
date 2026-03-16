"use client";

import { Select, SelectItem } from "@heroui/select";
import type { User, UserId } from "@/entities/user/model/types";

export interface AuthorDropdownProps {
  /** Список пользователей (авторов) для выбора */
  users: User[];
  /** Выбранный автор (пустая строка = все авторы) */
  selectedUserId: UserId | "";
  /** Обработчик смены автора */
  onAuthorChange: (userId: UserId | "") => void;
  /** Подпись поля */
  label?: string;
  /** Плейсхолдер при отсутствии выбора */
  placeholder?: string;
  /** Дополнительные классы для контейнера */
  classNames?: { base?: string };
}

export function AuthorDropdown({
  users,
  selectedUserId,
  onAuthorChange,
  label = "Автор",
  placeholder = "Все авторы",
  classNames,
}: AuthorDropdownProps) {
  return (
    <Select
      label={label}
      placeholder={placeholder}
      selectedKeys={selectedUserId !== "" ? [String(selectedUserId)] : []}
      onSelectionChange={(keys) => {
        const v = Array.from(keys)[0];
        onAuthorChange(v != null && v !== "" ? Number(v) : "");
      }}
      classNames={classNames ?? { base: "max-w-[200px]" }}
    >
      {users.map((u) => (
        <SelectItem key={String(u.id)} textValue={u.name}>
          {u.name}
        </SelectItem>
      ))}
    </Select>
  );
}
