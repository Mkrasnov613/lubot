import "./globals.css";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased text-white`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
