import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nikelink",
  description: "Connect. Share. Belong.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
