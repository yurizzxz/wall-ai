import { redirect } from "next/navigation";

import { requireSession } from "@/services/users/require-session";
import { Header } from "@/components/common/header";
import { ThemeProvider } from "@/components/common/theme-provider";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession().catch(() => redirect("/sign-in"));
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Header user={session.user} />
      <main className="flex-1 px-4 sm:px-6 lg:px-8">{children}</main>
    </ThemeProvider>
  );
}
