import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProviderWrapper from "@/provider/ThemeProvider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={inter.className}>

        <ThemeProviderWrapper>{children}
        <Toaster position="top-right" />
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
