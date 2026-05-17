import type { ReactNode } from "react";

import { Button } from "@heroui/button";
import clsx from "clsx";

import { MobileOnly } from "@/shared/ui/viewport-only";

/** Offset above the mobile bottom tab bar (h-16) + safe area. */
const FAB_BOTTOM_OFFSET =
  "calc(4rem + 1rem + env(safe-area-inset-bottom))";

interface IFloatingActionButtonProps {
  "aria-label": string;
  onPress: () => void;
  className?: string;
  icon?: ReactNode;
}

function PlusIcon() {
  return (
    <svg
      aria-hidden
      fill="none"
      height={24}
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={24}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function FloatingActionButton({
  "aria-label": ariaLabel,
  onPress,
  className,
  icon,
}: IFloatingActionButtonProps) {
  return (
    <MobileOnly>
      <div
        className={clsx(
          "pointer-events-none fixed right-4 z-40",
          className,
        )}
        style={{ bottom: FAB_BOTTOM_OFFSET }}
      >
        <Button
          isIconOnly
          aria-label={ariaLabel}
          className="pointer-events-auto h-14 w-14 shadow-lg shadow-primary/30"
          color="primary"
          radius="full"
          size="lg"
          onPress={onPress}
        >
          {icon ?? <PlusIcon />}
        </Button>
      </div>
    </MobileOnly>
  );
}
