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
      <body className={`antialiased text-white `}>
        {children}
        <Toaster />
        <span className="fixed bottom-1 right-2 text-[10px] text-white/30 pointer-events-none select-none">
          v{process.env.NEXT_PUBLIC_APP_VERSION}+{process.env.NEXT_PUBLIC_GIT_SHA}
        </span>
      </body>
    </html>
  );
}
