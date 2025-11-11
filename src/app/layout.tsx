import "./globals.css";
import { Toaster } from "sonner";
import { Tajawal } from "next/font/google";

const tajawal = Tajawal({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased text-white ${tajawal.className}`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
