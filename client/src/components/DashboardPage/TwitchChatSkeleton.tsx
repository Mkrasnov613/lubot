import { Box } from "@chakra-ui/react";

export default function TwitchChatSkeleton() {
  return (
    <Box
      className="animate-pulse"
      bg="surface"
      p="5"
      rounded="2xl"
      borderWidth="1px"
      borderColor="border"
      maxW="500px"
      position="relative"
      zIndex={100}
    >
      <Box w="460px" h="682px" bg="surface2" rounded="md" />
    </Box>
  );
}
