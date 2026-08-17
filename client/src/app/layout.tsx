import "./globals.css";
import { Toaster } from "sonner";
import { Inter } from "next/font/google";
import { Provider } from "@/components/ui/provider";
import { Box } from "@chakra-ui/react";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Provider>
          {children}
          <Toaster />
          <Box
            as="span"
            position="fixed"
            bottom="1"
            right="2"
            fontSize="10px"
            color="whiteAlpha.500"
            pointerEvents="none"
            userSelect="none"
          >
            v{process.env.NEXT_PUBLIC_APP_VERSION}+{process.env.NEXT_PUBLIC_GIT_SHA}
          </Box>
        </Provider>
      </body>
    </html>
  );
}
