import { Link } from "@heroui/link";

import { Head } from "./head";

import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Navbar } from "@/components/navbar";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen">
      <Head />
      <Navbar />
      <main className="container mx-auto max-w-7xl flex-grow px-4 pt-16 pb-[calc(4rem+env(safe-area-inset-bottom))] sm:px-6 lg:pb-0">
        {children}
      </main>
      <MobileBottomNav />
      <footer className="hidden w-full items-center justify-center py-3 lg:flex">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="https://www.heroui.com"
          title="heroui.com homepage"
        >
          {/* <span className="text-default-600">Powered by</span> */}
          {/* <p className="text-primary">HeroUI</p> */}
        </Link>
      </footer>
    </div>
  );
}
