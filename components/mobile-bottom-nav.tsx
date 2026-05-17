import type { FC } from "react";

import { observer } from "mobx-react-lite";
import NextLink from "next/link";
import { useRouter } from "next/router";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import type { IconSvgProps } from "@/types";

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/" || pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function DashboardNavIcon(props: IconSvgProps) {
  return (
    <svg
      aria-hidden
      fill="none"
      height={24}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={24}
      {...props}
    >
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

function OperationsNavIcon(props: IconSvgProps) {
  return (
    <svg
      aria-hidden
      fill="none"
      height={24}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={24}
      {...props}
    >
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function CategoriesNavIcon(props: IconSvgProps) {
  return (
    <svg
      aria-hidden
      fill="none"
      height={24}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={24}
      {...props}
    >
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

const navIcons: Record<string, FC<IconSvgProps>> = {
  "/": DashboardNavIcon,
  "/operations": OperationsNavIcon,
  "/categories": CategoriesNavIcon,
};

export const MobileBottomNav = observer(function MobileBottomNav() {
  const router = useRouter();
  const pathname = router.pathname;

  return (
    <nav
      aria-label="Основная навигация"
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-divider bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
        {siteConfig.navItems.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);
          const Icon = navIcons[item.href] ?? DashboardNavIcon;

          return (
            <NextLink
              key={item.href}
              aria-current={isActive ? "page" : undefined}
              className={clsx(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary font-medium"
                  : "text-default-500 hover:text-foreground",
              )}
              href={item.href}
            >
              <Icon
                className={clsx(
                  "flex-shrink-0",
                  isActive && "stroke-[2.25]",
                )}
              />
              <span className="truncate max-w-full">{item.label}</span>
            </NextLink>
          );
        })}
      </div>
    </nav>
  );
});
