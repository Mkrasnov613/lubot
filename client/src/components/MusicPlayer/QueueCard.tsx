import Image from "next/image";
import type { Track } from "@/types/musicPlayer";
import { Box, Flex } from "@chakra-ui/react";

export default function QueueCard({ track }: { track: Track }) {
  return (
    <Flex
      as="li"
      align="center"
      gap="3"
      rounded="xl"
      borderWidth="1px"
      borderColor="border"
      borderTopColor="highlight"
      bgGradient="to-b"
      gradientFrom="surface2"
      gradientTo="surface"
    >
      {/* Square cover */}
      <Box position="relative" h="16" w="16" overflow="hidden" roundedLeft="xl">
        <Image src={track.thumb} alt={track.title} fill style={{ objectFit: "cover" }} />
      </Box>

      {/* Title + Author */}
      <Box minW="0" flex="1">
        <Box truncate fontSize="sm" fontWeight="medium">
          {track.title}
        </Box>
        <Box truncate fontSize="13px" color="textMuted">
          {track.author?.name ?? "—"}
        </Box>
      </Box>

      {/* @requester at the far right */}
      <Box whiteSpace="nowrap" fontSize="xs" color="textMuted" mr="5">
        @{track.requester}
      </Box>
    </Flex>
  );
}
