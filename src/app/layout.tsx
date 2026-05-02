import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fintrack",
  description: "Fintrack automatically captures every transaction from your email, SMS, and receipts using advanced AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <meta content="width=device-width, initial-scale=1.0, viewport-fit=cover" name="viewport" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Manrope:wght@600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body-md text-on-surface bg-background">
        {children}
      </body>
    </html>
  );
}
