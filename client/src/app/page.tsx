import Link from "next/link";
import Image from "next/image";
import { API_BASE_URL } from "@/lib/config";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";

export default function Home() {
  return (
    <Box
      as="section"
      position="relative"
      h="100vh"
      display="flex"
      flexDir="column"
      justifyContent="center"
      alignItems="center"
      overflow="hidden"
    >
      <Image
        src="/logo.png"
        width={86}
        height={86}
        alt=""
        style={{ position: "absolute", top: 40, left: 40, zIndex: 3 }}
      />
      <video
        width={1980}
        autoPlay
        muted
        loop
        style={{ position: "relative", zIndex: 0, width: "100%" }}
      >
        <source src="bg.mp4" type="video/mp4" />
      </video>
      <Box position="absolute" inset="0" bg="blackAlpha.900" zIndex={1} />
      <Flex
        position="absolute"
        left="0"
        flexDir="column"
        bg="bg"
        w="50vw"
        h="100vh"
        justify="center"
        align="center"
        zIndex={2}
      >
        <Flex flexDir="column" justify="center" align="flex-start" gap="5">
          <Heading
            as="h1"
            fontSize="72px"
            lineHeight="80px"
            maxW="30rem"
            color="text"
            textShadow="0 4px 40px color-mix(in srgb, var(--color-text) 40%, transparent)"
          >
            Your bot for{" "}
            <Box
              as="span"
              color="twitch"
              textShadow="0 4px 40px color-mix(in srgb, var(--color-twitch) 40%, transparent)"
            >
              your
            </Box>{" "}
            audience
          </Heading>
          <Text color="textMuted" fontSize="xl" maxW="30rem">
            A streamer tool for automating live chat messages, moderation, and
            more
          </Text>
          <Link href={`${API_BASE_URL}/auth/twitch/login`}>
            <Flex
              bg="twitch"
              h="3.25rem"
              w="14rem"
              rounded="xl"
              color="text"
              fontWeight="semibold"
              align="center"
              justify="space-around"
            >
              <Image src="/twitch.png" width={32} height={32} alt="" />
              Log in with Twitch
            </Flex>
          </Link>
        </Flex>
      </Flex>
    </Box>
  );
}
