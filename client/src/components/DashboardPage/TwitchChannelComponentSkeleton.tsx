import { Box, Flex } from "@chakra-ui/react";

export default function TwitchChannelComponentSkeleton() {
  return (
    <Flex
      as="article"
      className="shadow-large animate-pulse"
      direction="column"
      gap="5"
      minH="400px"
      w="760px"
      p="5"
      bgGradient="to-b"
      gradientFrom="surface2"
      gradientTo="surface"
      borderWidth="1px"
      borderColor="border"
      borderTopColor="highlight"
      rounded="2xl"
      alignSelf="flex-end"
    >
      {/* TwitchPlayer skeleton */}
      <Box display="flex" alignItems="center">
        <Box w="100%" h="480px" bg="surface2" rounded="lg" />
      </Box>

      {/* Channel info skeleton */}
      <Flex gap="5" fontWeight="semibold" justify="flex-start" align="center" color="text">
        {/* Box art skeleton */}
        <Box w="70px" h="93px" rounded="md" bg="surface2" />

        {/* Channel name and meta skeleton */}
        <Flex direction="column" gap="2">
          <Box h="7" w="48" bg="surface2" rounded="md" />
          <Box h="5" w="64" bg="surface2" rounded="md" />
          <Box h="5" w="52" bg="surface2" rounded="md" mt="1" />
        </Flex>
      </Flex>
    </Flex>
  );
}
