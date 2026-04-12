"use client";

import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { Spinner } from "@heroui/spinner";

import { useRootStore } from "@/shared/store/root-store";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

export const AuthGate = observer(function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useRootStore();
  const publicRoute = isPublicRoute(router.pathname);

  useEffect(() => {
    void user.loadCurrentUser();
  }, [user, router.pathname]);

  useEffect(() => {
    if (!user.sessionChecked) return;
    if (!user.isAuthenticated && !publicRoute) {
      const q =
        router.asPath && router.asPath !== "/"
          ? `?from=${encodeURIComponent(router.asPath)}`
          : "";

      void router.replace(`/login${q}`);
    }

    if (user.isAuthenticated && publicRoute) {
      const raw = router.query.from;
      const from = typeof raw === "string" && raw.startsWith("/") ? raw : "/";

      void router.replace(from);
    }
  }, [user.sessionChecked, user.isAuthenticated, publicRoute, router]);

  if (!user.sessionChecked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Spinner size="lg" />
        <span className="text-sm text-default-500">Загрузка…</span>
      </div>
    );
  }

  if (!user.isAuthenticated && !publicRoute) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Spinner size="lg" />
        <span className="text-sm text-default-500">Перенаправление…</span>
      </div>
    );
  }

  if (user.isAuthenticated && publicRoute) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Spinner size="lg" />
        <span className="text-sm text-default-500">Перенаправление…</span>
      </div>
    );
  }

  return <>{children}</>;
});
