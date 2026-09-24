import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProviderWrapper from "@/provider/ThemeProvider";
import { Toaster } from "sonner";

// Fallback for non-Apple devices; Apple devices render the system SF font
// first (see fontFamily.sans in tailwind.config.ts).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "MyClinic MD",
  description: "Streamline clinic solutions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* suppressHydrationWarning: browser extensions (password managers,
          Grammarly) add attributes to <body> before React hydrates. */}
      <body className={`${inter.variable} font-sans`} suppressHydrationWarning>
        <ThemeProviderWrapper>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: "rounded-lg shadow-mac-lg border border-border font-sans text-body",
            }}
          />
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
