import { observer } from "mobx-react-lite";
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import { useRouter } from "next/router";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { useRootStore } from "@/shared/store/root-store";

export const Navbar = observer(function Navbar() {
  const router = useRouter();
  const pathname = router.pathname;
  const { user } = useRootStore();

  const currentUser = user.currentUser;

  async function handleLogout() {
    try {
      await user.logout();
      await router.push("/login");
    } catch {
      /* store keeps error */
    }
  }

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            {/* <Logo /> */}
            {/* Logo */}
            <p className="font-bold text-inherit">Logo</p>
          </NextLink>
        </NavbarBrand>
        <div className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <NavbarItem key={item.href}>
                <NextLink
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    isActive && "text-primary font-bold",
                  )}
                  href={item.href}
                >
                  {item.label}
                </NextLink>
              </NavbarItem>
            );
          })}
        </div>
      </NavbarContent>

      <NavbarContent className="basis-1/5 sm:basis-full" justify="end">
        <NavbarItem className="flex items-center gap-3">
          <ThemeSwitch />
          <div className="flex items-center gap-2">
            <Avatar
              showFallback
              classNames={{ base: "flex-shrink-0" }}
              name={currentUser?.name}
              size="sm"
            />
            <span className="hidden text-sm font-medium text-foreground truncate max-w-[120px] sm:inline sm:max-w-[180px]">
              {currentUser?.name ?? "Гость"}
            </span>
            {user.isAuthenticated ? (
              <Button
                color="default"
                isLoading={user.loading}
                size="sm"
                variant="flat"
                onPress={handleLogout}
              >
                Выйти
              </Button>
            ) : null}
          </div>
        </NavbarItem>
      </NavbarContent>
    </HeroUINavbar>
  );
});
