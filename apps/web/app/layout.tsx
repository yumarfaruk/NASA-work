import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ƙura Alert — Harmattan dust forecast for Gombe",
  description:
    "A plain-language, Hausa and English dust forecast for Gombe, Nigeria. Built on NASA Earth observation data.",
  openGraph: {
    title: "Ƙura Alert — Gombe dust forecast",
    description:
      "Know when harmattan dust will be heavy. Laundry, market, school and health advice in Hausa and English.",
  },
};

export const viewport = {
  themeColor: "#f8f1e3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
