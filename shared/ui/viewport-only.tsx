import type { ReactNode } from "react";

import clsx from "clsx";

interface IViewportOnlyProps {
  children: ReactNode;
  className?: string;
  /** On desktop, `display: contents` so children participate in parent flex/grid. */
  contentsOnDesktop?: boolean;
}

/** Visible from `lg` breakpoint and up (desktop table layout). */
export function DesktopOnly({
  children,
  className,
  contentsOnDesktop = false,
}: IViewportOnlyProps) {
  return (
    <div
      className={clsx(
        "max-lg:hidden",
        contentsOnDesktop ? "lg:contents" : "lg:block",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Visible below `lg` breakpoint (mobile card layout). */
export function MobileOnly({ children, className }: IViewportOnlyProps) {
  return <div className={clsx("lg:hidden", className)}>{children}</div>;
}
