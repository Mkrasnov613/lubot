import Link from "next/link";
import Image from "next/image";
import { API_BASE_URL } from "@/lib/config";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";

export default function Home() {
  return (
    <Box as="section" position="relative" h="100dvh" overflow="hidden">
      {/* Ambient stream footage behind the panel. It's decoration, so it's
          hidden from assistive tech and sits under a heavy scrim — the panel
          is what has to be readable. */}
      <Box position="absolute" inset="0" zIndex={0} aria-hidden="true">
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        >
          <source src="bg.mp4" type="video/mp4" />
        </video>
        <Box
          position="absolute"
          inset="0"
          bg="ground"
          opacity={{ base: 0.92, lg: 0.55 }}
        />
      </Box>

      {/* The sign-in panel is a rack unit like everything inside the app, lit
          down its trailing edge — the same violet-as-light rule the dashboard
          runs on, so the product looks continuous across the login. */}
      <Flex
        position="relative"
        zIndex={1}
        direction="column"
        justify="center"
        h="100%"
        w={{ base: "100%", lg: "min(560px, 50vw)" }}
        px={{ base: "6", md: "10", lg: "12" }}
        bg={{ base: "transparent", lg: "chassis" }}
        borderRightWidth={{ base: 0, lg: "2px" }}
        borderRightColor="signal"
        boxShadow={{ base: "none", lg: "8px 0 40px -12px rgba(145, 70, 255, 0.35)" }}
      >
        <Flex align="center" gap="2.5" position="absolute" top="8" left={{ base: "6", md: "10", lg: "12" }}>
          <Image src="/logo.png" width={30} height={30} alt="" />
          <Text fontWeight="semibold" fontSize="md">
            LuBot
          </Text>
        </Flex>

        <Box maxW="26rem">
          <Heading
            as="h1"
            fontSize={{ base: "34px", md: "var(--text-display)" }}
            lineHeight="1.05"
            letterSpacing="var(--tracking-display)"
            fontWeight="medium"
          >
            Moderation that reads more than a word list.
          </Heading>

          <Text fontSize="md" color="engrave" mt="5" maxW="34ch">
            Pattern-matching rules with real actions, chat commands with
            cooldowns and permission levels, and song requests. Set up from one
            dashboard — nothing to host, nothing to script.
          </Text>

          <Link href={`${API_BASE_URL}/auth/twitch/login`}>
            <Flex
              mt="8"
              h="46px"
              w="fit-content"
              px="5"
              gap="2.5"
              bg="signal"
              color="white"
              rounded="sm"
              fontWeight="medium"
              align="center"
              transition="background-color 0.12s ease"
              _hover={{ bg: "signalLit" }}
            >
              <TwitchGlyph />
              Log in with Twitch
            </Flex>
          </Link>

          <Text fontSize="xs" color="faint" mt="4" maxW="34ch">
            LuBot asks for the permissions it needs to read chat and act on it,
            and nothing else.
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}

/**
 * The Twitch mark, inline and in currentColor. public/twitch.png is a solid
 * black glyph, which disappears against the violet button — the brand's own
 * guidance is white-on-violet, and an inline path also scales cleanly.
 */
function TwitchGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4.265 3 3 6.236v13.05h4.5V22h2.531l2.53-2.714h3.797L21 14.357V3H4.265zm1.686 1.81h13.36v8.632l-2.953 3.166h-4.218l-2.53 2.712v-2.712H5.951V4.81zm4.5 8.096h1.686V7.973h-1.687v4.933zm4.64 0h1.686V7.973h-1.687v4.933z" />
    </svg>
  );
}
