"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

type NavigationItem = {
  label: string;
  href: string;
};

type HeaderProps = {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
};
const NAVIGATION_ITEMS = [
  {
    label: "Visão geral",
    href: "/dashboard",
  },
  {
    label: "Contas",
    href: "/dashboard/accounts",
  },
  {
    label: "Transações",
    href: "/dashboard/transactions",
  },
  {
    label: "Cartões",
    href: "/dashboard/credit-cards",
  },
  {
    label: "Faturas",
    href: "/dashboard/invoices",
  },
  {
    label: "Categorias",
    href: "/dashboard/categories",
  },
  {
    label: "Recorrências",
    href: "/dashboard/recurrences",
  },
  {
    label: "Metas",
    href: "/dashboard/savings-goals",
  },
  {
    label: "Dívidas",
    href: "/dashboard/debts",
  },
] satisfies readonly NavigationItem[];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="mx-auto flex justify-between w-full py-1 items-center gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex shrink-0 text-xl items-center gap-2 rounded-md font-heading font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            aria-label="WallAI — visão geral"
          >
            <span>Wall<span className="text-primary">AI</span></span>
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Principal"
          >
            {NAVIGATION_ITEMS.map((item) => {
              const active = isActiveRoute(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-8 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30",
                    active && "bg-primary text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl">
          <div className="hidden flex-col md:flex">
            <Avatar>
              <AvatarImage src={user.image || ""} alt={user.name} className="w-8 h-8" />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col">
            <span className="leading-tight text-start">{user.name ?? "User"}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>

        <div className="ml-auto md:hidden">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" />}>
              <MenuIcon aria-hidden="true" />
              <span className="sr-only">Abrir navegação</span>
            </SheetTrigger>
            <SheetContent className="w-72" side="right">
              <SheetHeader>
                <SheetTitle>Navegação</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label="Principal">
                {NAVIGATION_ITEMS.map((item) => {
                  const active = isActiveRoute(pathname, item.href);

                  return (
                    <SheetClose
                      key={item.href}
                      render={
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex h-10 w-full items-center rounded-md px-3 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30",
                            active && "bg-muted text-foreground",
                          )}
                        />
                      }
                    >
                      {item.label}
                    </SheetClose>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
