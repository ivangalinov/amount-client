import { createContext, useContext } from "react";
import { enableStaticRendering } from "mobx-react-lite";
import { isBrowser } from "@/shared/lib/runtime";
import { userStore, UserStore } from "@/entities/user/model/user.store";
import {
  workspaceStore,
  WorkspaceStore,
} from "@/entities/workspace/model/workspace.store";
import {
  categoryStore,
  CategoryStore,
} from "@/entities/category/model/category.store";
import {
  operationStore,
  OperationStore
} from "@/entities/operation/model/operation.store";
import { statsStore, StatsStore } from "@/entities/stats/model/stats.store";

enableStaticRendering(!isBrowser);

export interface IRootStore {
  user: UserStore;
  workspace: WorkspaceStore;
  category: CategoryStore;
  operation: OperationStore;
  stats: StatsStore;
}

const rootStore: IRootStore = {
  user: userStore,
  workspace: workspaceStore,
  category: categoryStore,
  operation: operationStore,
  stats: statsStore,
};

const RootStoreContext = createContext<IRootStore | null>(null);

export function RootStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootStoreContext.Provider value={rootStore}>
      {children}
    </RootStoreContext.Provider>
  );
}

export function useRootStore(): IRootStore {
  const ctx = useContext(RootStoreContext);
  if (!ctx) {
    throw new Error("useRootStore must be used within RootStoreProvider");
  }
  return ctx;
}
