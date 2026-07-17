import { redirect } from "next/navigation";

import { requireSession } from "@/services/users/require-session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    await requireSession();
  } catch {
    redirect("/sign-in");
  }
  return <main>{children}</main>;
}
