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
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { TelegramIntegrationDialog } from "./telegram-integration-dialog";

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

  const signOut = async () => {
    await authClient.signOut();
    window.location.href = "/sign-in";
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="mx-auto flex w-full justify-between items-center gap-6 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex shrink-0 text-xl items-center gap-2 rounded-md font-heading font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            aria-label="WallAI — visão geral"
          >
            <span>
              Wall<span className="text-primary">AI</span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 xl:flex"
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
                    active &&
                      "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <TelegramIntegrationDialog />
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <div className="ml-auto items-center gap-2.5 rounded-lg px-2 mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" />}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.image || ""} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-74" align="end">
                <div className="flex gap-3 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.image || ""} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col mb-3">
                    <span className="leading-tight text-start">
                      {user.name ?? "User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
                <DropdownMenuItem className="cursor-pointer w-full">
                  <Button
                    variant="ghost"
                    className={"p-0"}
                    onClick={() => signOut()}
                  >
                    Sair
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="ml-auto xl:hidden">
            <Sheet>
              <SheetTrigger render={<Button variant="ghost" size="icon-lg" />}>
                <MenuIcon aria-hidden="true" />
                <span className="sr-only">Abrir navegação</span>
              </SheetTrigger>
              <SheetContent className="w-72" side="right">
                <SheetHeader>
                  <span className="text-xl font-semibold">
                    Wall<span className="text-primary">AI</span>
                  </span>
                </SheetHeader>
                <nav
                  className="flex flex-col gap-1 px-4"
                  aria-label="Principal"
                >
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
                              "flex h-8 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30",
                              active &&
                                "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
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
      </div>
    </header>
  );
}
