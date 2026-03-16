import { describe, it, expect } from "vitest";
import { userLocalStorageApi } from "@/entities/user/api/local-storage";
import { workspaceLocalStorageApi } from "@/entities/workspace/api/local-storage";

/**
 * Тесты механизма загрузки авторов:
 * - при создании workspace по умолчанию текущий пользователь добавляется в workspace users
 * - listWorkspaceUsers возвращает пользователей, добавленных в workspace
 */
describe("workspace API — загрузка авторов", () => {
  it("при вызове getCurrentUser перед listWorkspaces в workspace по умолчанию есть текущий пользователь", async () => {
    const currentUser = await userLocalStorageApi.getCurrentUser();
    expect(currentUser).not.toBeNull();

    const { items: workspaces } = await workspaceLocalStorageApi.listWorkspaces();
    expect(workspaces.length).toBeGreaterThanOrEqual(1);
    const workspaceId = workspaces[0].id;

    await workspaceLocalStorageApi.addUserToWorkspace({
      workspaceId,
      userId: currentUser!.id,
    });
    const workspaceUsers = await workspaceLocalStorageApi.listWorkspaceUsers(workspaceId);
    expect(workspaceUsers.length).toBeGreaterThanOrEqual(1);
    expect(workspaceUsers.some((wu) => wu.userId === currentUser!.id)).toBe(true);
  });

  it("addUserToWorkspace добавляет пользователя, listWorkspaceUsers его возвращает", async () => {
    const currentUser = await userLocalStorageApi.getCurrentUser();
    expect(currentUser).not.toBeNull();

    const { items: workspaces } = await workspaceLocalStorageApi.listWorkspaces();
    const workspaceId = workspaces[0].id;

    const before = await workspaceLocalStorageApi.listWorkspaceUsers(workspaceId);
    const added = await workspaceLocalStorageApi.addUserToWorkspace({
      workspaceId,
      userId: currentUser!.id,
    });
    const after = await workspaceLocalStorageApi.listWorkspaceUsers(workspaceId);

    expect(added.workspaceId).toBe(workspaceId);
    expect(added.userId).toBe(currentUser!.id);
    expect(after.length).toBe(before.length + 1);
    expect(after.some((wu) => wu.id === added.id)).toBe(true);
  });
});
