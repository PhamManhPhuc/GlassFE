import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
});

const displayFont = Syne({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "KYRO",
  description: "Kính mắt và phụ kiện cao cấp với trải nghiệm hiện đại, tinh gọn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="scroll-smooth">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} bg-background font-body text-foreground antialiased`}
      >
        <AppProvider>
          {children}
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
