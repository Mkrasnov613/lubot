import { Flex, Heading, Text } from "@chakra-ui/react";

export default async function MusicPage() {
  // ─── UI ───
  return (
    <Flex direction="column" align="center" justify="center" gap="3" px="4" py="16" bg="bg" color="text">
      <Heading as="h1" size="lg">
        Music
      </Heading>
      <Text color="textMuted">This page is being rebuilt.</Text>
    </Flex>
  );
}
