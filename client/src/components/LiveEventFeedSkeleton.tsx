import { Box, Flex } from "@chakra-ui/react";
import Panel from "@/components/Panel";

export default function LiveEventFeedSkeleton() {
  return (
    <Panel label="Activity" flush>
      <Box as="ul" listStyleType="none">
        {[0, 1, 2, 3].map((i) => (
          <Flex
            key={i}
            as="li"
            align="center"
            gap="2.5"
            px="3"
            py="2"
            borderBottomWidth="1px"
            borderColor="seam"
            borderLeftWidth="2px"
            borderLeftColor="transparent"
            _last={{ borderBottomWidth: 0 }}
          >
            <Box
              className="animate-pulse"
              w="28px"
              h="28px"
              rounded="xs"
              flexShrink={0}
            />
            <Box className="animate-pulse" h="11px" w="120px" rounded="xs" />
            <Box
              className="animate-pulse"
              h="10px"
              w="40px"
              rounded="xs"
              ml="auto"
            />
          </Flex>
        ))}
      </Box>
    </Panel>
  );
}
