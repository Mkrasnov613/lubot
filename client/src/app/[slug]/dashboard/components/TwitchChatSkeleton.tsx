import { Box, Flex } from "@chakra-ui/react";
import Panel from "@/components/Panel";

export default function TwitchChatSkeleton() {
  return (
    <Panel label="Chat" flush>
      <Flex
        direction="column"
        gap="3"
        p="3"
        h={{ base: "420px", xl: "calc(100dvh - var(--topbar-h) - 92px)" }}
      >
        {/* Uneven widths so it reads as chat lines rather than a form. */}
        {[86, 64, 92, 51, 78, 70, 58, 88].map((w, i) => (
          <Flex key={i} gap="2" align="center">
            <Box
              className="animate-pulse"
              w="18px"
              h="18px"
              rounded="xs"
              flexShrink={0}
            />
            <Box className="animate-pulse" h="10px" w={`${w}%`} rounded="xs" />
          </Flex>
        ))}
      </Flex>
    </Panel>
  );
}
