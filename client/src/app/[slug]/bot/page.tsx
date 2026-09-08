import { Box, Flex, Text } from "@chakra-ui/react";
import Panel from "@/components/Panel";

export default async function BotPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await params;

  return (
    <Panel label="Moderation">
      <Flex direction="column" align="flex-start" gap="1.5" maxW="52ch">
        <Text fontSize="lg" fontWeight="medium">
          Rules are being rebuilt
        </Text>
        <Text fontSize="sm" color="engrave">
          Word and pattern matching with timeouts and deletes is coming back
          here. Until it lands, moderate from Twitch&apos;s own dashboard —
          nothing you set there will be overwritten.
        </Text>
        <Text fontSize="xs" color="faint" mt="1">
          Chat commands like{" "}
          <Box as="span" className="mono" color="engrave">
            !timeout
          </Box>{" "}
          keep working while this page is down.
        </Text>
      </Flex>
    </Panel>
  );
}
