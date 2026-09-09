import { Box, Flex } from "@chakra-ui/react";
import Panel from "@/components/Panel";

/**
 * The panel arrives before its contents do — same chassis, same label, with
 * unlit wells where the values will be. Nothing about the frame moves, so the
 * layout doesn't jump when the data lands.
 */
export default function TwitchChannelComponentSkeleton() {
  return (
    <Panel label="Broadcast" flush>
      <Box w="100%" aspectRatio="16 / 9" maxH="46vh" bg="video" />
      <Flex
        gap="3"
        p="var(--panel-pad)"
        borderTopWidth="1px"
        borderColor="seam"
        align="flex-start"
      >
        <Box className="animate-pulse" w="54px" h="72px" rounded="xs" flexShrink={0} />
        <Flex direction="column" gap="2" flex="1" pt="1">
          <Box className="animate-pulse" h="14px" w="180px" rounded="xs" />
          <Box className="animate-pulse" h="12px" w="min(320px, 90%)" rounded="xs" />
          <Box className="animate-pulse" h="10px" w="120px" rounded="xs" />
        </Flex>
      </Flex>
    </Panel>
  );
}
