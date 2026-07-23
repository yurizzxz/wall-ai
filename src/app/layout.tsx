import type { Metadata } from "next";

import "./globals.css";
import { Nunito_Sans, IBM_Plex_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const ibmPlexSansHeading = IBM_Plex_Sans({subsets:['latin'],variable:'--font-heading'});

const nunitoSans = Nunito_Sans({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: "Wallai",
    template: "%s | Wallai",
  },
  description:
    "Organize contas, cartões, lançamentos e metas financeiras em um só lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={cn("h-full antialiased", "font-sans", nunitoSans.variable, ibmPlexSansHeading.variable)}>
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
