import Image from "next/image";

import { siteConfig } from "@/config/site";

interface IAppLogoProps {
  showName?: boolean;
  iconSize?: number;
  className?: string;
}

export function AppLogo({
  showName = true,
  iconSize = 32,
  className,
}: IAppLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Image
        priority
        alt=""
        className="rounded-lg shrink-0"
        height={iconSize}
        src="/icons/icon-192.png"
        width={iconSize}
      />
      {showName ? (
        <span className="font-bold text-inherit">{siteConfig.name}</span>
      ) : null}
    </span>
  );
}
