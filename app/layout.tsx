import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Runmark — Interactive playbooks",
  description: "Turn operational documentation into guided, verifiable workflow runs.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
