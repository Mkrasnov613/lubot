import { Box, Flex, Text } from "@chakra-ui/react";
import Panel from "@/components/Panel";

export default async function MusicPage() {
  return (
    <Panel label="Song requests">
      <Flex direction="column" align="flex-start" gap="1.5" maxW="52ch">
        <Text fontSize="lg" fontWeight="medium">
          The queue is being rebuilt
        </Text>
        <Text fontSize="sm" color="engrave">
          Viewers will request tracks with{" "}
          <Box as="span" className="mono" color="signalText">
            !song
          </Box>{" "}
          and the queue will play from this panel, with skip and volume on the
          same strip.
        </Text>
      </Flex>
    </Panel>
  );
}
