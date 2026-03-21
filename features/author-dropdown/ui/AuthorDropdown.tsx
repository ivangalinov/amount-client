"use client";

import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useRootStore } from "@/shared/store/root-store";
import type { IUser } from "@/entities/user/model/types";
import { AuthorDropdown as AuthorDropdownUI } from "@/entities/user/ui/dropdown";

export interface IAuthorDropdownProps {
  /** Выбранный автор (пустая строка = все авторы) */
  selectedUserId: number | "";
  /** Обработчик смены автора */
  onAuthorChange: (userId: number | "") => void;
  /** Подпись поля */
  label?: string;
  /** Плейсхолдер при отсутствии выбора */
  placeholder?: string;
  /** Дополнительные классы для контейнера */
  classNames?: { base?: string };
}

export const AuthorDropdown = observer(function AuthorDropdown({
  selectedUserId,
  onAuthorChange,
  label,
  placeholder,
  classNames,
}: IAuthorDropdownProps) {
  const { user, workspace } = useRootStore();
  const activeWorkspace = workspace.activeWorkspace;

  useEffect(() => {
    if (!activeWorkspace) return;
    void (async () => {
      await workspace.loadWorkspaceUsers(activeWorkspace.id);
      if (
        workspace.workspaceUsers.length === 0 &&
        user.currentUser
      ) {
        await workspace.addUserToWorkspace({
          workspaceId: activeWorkspace.id,
          userId: user.currentUser.id,
        });
        void user.loadUserById(user.currentUser.id);
      }
    })();
  }, [activeWorkspace?.id, user.currentUser?.id, workspace, user]);

  useEffect(() => {
    workspace.workspaceUsers.forEach((wu) => void user.loadUserById(wu.userId));
  }, [workspace.workspaceUsers, user]);

  const users: IUser[] = [...workspace.workspaceUsers]
    .map((wu) => user.usersById.get(wu.userId))
    .filter((u): u is IUser => u != null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AuthorDropdownUI
      users={users}
      selectedUserId={selectedUserId}
      onAuthorChange={onAuthorChange}
      label={label}
      placeholder={placeholder}
      classNames={classNames}
    />
  );
});
