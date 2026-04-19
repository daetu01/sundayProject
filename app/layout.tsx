import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diet Finder SNS",
  description: "macOS-inspired diet social feed built with Next.js and Tailwind CSS"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
