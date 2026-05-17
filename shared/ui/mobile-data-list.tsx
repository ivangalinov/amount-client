import type { ReactNode } from "react";

import clsx from "clsx";

interface IMobileDataListProps {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}

export function MobileDataList({
  children,
  className,
  "aria-label": ariaLabel,
}: IMobileDataListProps) {
  return (
    <ul aria-label={ariaLabel} className={clsx("flex flex-col divide-y divide-divider", className)}>
      {children}
    </ul>
  );
}

interface IMobileDataListItemProps {
  title: ReactNode;
  trailing?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function MobileDataListItem({
  title,
  trailing,
  description,
  footer,
  className,
}: IMobileDataListItemProps) {
  return (
    <li className={clsx("flex flex-col gap-2 px-3 py-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 font-medium leading-snug">{title}</div>
        {trailing ? (
          <div className="shrink-0 text-right">{trailing}</div>
        ) : null}
      </div>
      {description ? (
        <div className="text-sm text-default-500 leading-snug">{description}</div>
      ) : null}
      {footer ? <div className="flex flex-wrap items-center gap-2">{footer}</div> : null}
    </li>
  );
}

interface IMobileDataListStateProps {
  children: ReactNode;
  className?: string;
}

export function MobileDataListState({ children, className }: IMobileDataListStateProps) {
  return (
    <p className={clsx("px-3 py-8 text-center text-sm text-default-500", className)}>
      {children}
    </p>
  );
}
