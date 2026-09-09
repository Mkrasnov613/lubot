import "./globals.css";
import { Toaster } from "sonner";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Provider } from "@/lib/chakra/provider";
import { Box } from "@chakra-ui/react";

/**
 * Plex Sans runs the interface; Plex Mono is for machine syntax only — chat
 * commands, regex rules, overlay URLs, and numbers that tick. Same
 * superfamily, so they share proportions and the pairing reads as one voice.
 */
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata = {
  title: "LuBot",
  description:
    "Moderation, song requests and chat commands for your Twitch channel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <Provider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              /* Sonner renders outside the Chakra tree, so it reads the CSS
                 custom properties directly. */
              style: {
                background: "var(--color-chassis)",
                border: "1px solid var(--color-edge)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text)",
                fontFamily: "var(--font-ui)",
                fontSize: "var(--text-sm)",
                boxShadow: "var(--shadow-menu)",
              },
            }}
          />
          <Box
            as="span"
            className="mono"
            position="fixed"
            bottom="1"
            right="2"
            fontSize="10px"
            color="faint"
            opacity={0.6}
            pointerEvents="none"
            userSelect="none"
            zIndex="1"
          >
            v{process.env.NEXT_PUBLIC_APP_VERSION}+
            {process.env.NEXT_PUBLIC_GIT_SHA}
          </Box>
        </Provider>
      </body>
    </html>
  );
}
