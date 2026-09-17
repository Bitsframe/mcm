"use client";

import { ThemeProvider } from "next-themes";

export default function ThemeProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Light only. The dark palette was never finished — roughly 3,000 `dark:`
    // classes exist across the app but were inconsistent in practice, so the
    // toggle has been removed and the theme is pinned. forcedTheme keeps those
    // classes from ever matching; they are left in place rather than ripped out
    // of 97 files.
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      {children}
    </ThemeProvider>
  );
}
