import { Box, Flex } from "@chakra-ui/react";

export default function LiveEventFeedSkeleton() {
  return (
    <Box className="scrollbar" rounded="xl" p="3" overflowX="scroll" w="100%" scrollBehavior="smooth">
      <Flex gap="4" align="center">
        {[1, 2, 3, 4, 5].map((i) => (
          <Flex
            key={i}
            className="animate-pulse"
            position="relative"
            rounded="xl"
            bgGradient="to-b"
            gradientFrom="surface2"
            gradientTo="surface"
            borderWidth="1px"
            borderColor="border"
            p="2"
            h="20"
            gap="5"
            minW="25rem"
          >
            {/* Profile image skeleton */}
            <Box w="16" h="16" rounded="full" bg="surface2" />

            {/* User info skeleton */}
            <Flex direction="column" justify="center" gap="2">
              <Box h="4" w="32" bg="surface2" rounded="md" />
              <Box h="3" w="20" bg="surface2" rounded="md" />
            </Flex>

            {/* Time skeleton */}
            <Box position="absolute" top="3" right="5" h="3" w="12" bg="surface2" rounded="md" />
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}
