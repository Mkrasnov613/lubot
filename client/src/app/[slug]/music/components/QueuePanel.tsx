"use client";

import { Track } from "@/types/musicPlayer";
import Image from "next/image";
import { useQueue } from "@/hooks/useQueue";
import { Box, Flex, Text, Heading } from "@chakra-ui/react";

type QueuePanelProps = {
  initialQueue?: Track[];
  initialNowPlaying?: Track | null;
  tenantId: string | null;
};

export default function QueuePanel({
  initialQueue = [],
  initialNowPlaying = null,
  tenantId,
}: QueuePanelProps) {
  const { queue, nowPlaying } = useQueue(initialQueue, initialNowPlaying, tenantId);

  return (
    <Flex direction="column" gap="5">
      {/* Now playing */}
      <Flex direction="column" gap="3">
        <Heading as="h4" fontSize="xs" textTransform="uppercase" letterSpacing="wider" color="textMuted" fontWeight="medium">
          Now Playing
        </Heading>
        {nowPlaying ? (
          <Flex align="center" gap="3" rounded="xl" borderWidth="1px" borderColor="border" bg="surface2" p="3">
            {nowPlaying.thumb && (
              <Box position="relative" h="16" w="16" flexShrink={0} overflow="hidden" rounded="lg">
                <Image src={nowPlaying.thumb} alt={nowPlaying.title} fill style={{ objectFit: "cover" }} />
              </Box>
            )}
            <Box minW="0" flex="1">
              <Box truncate fontSize="sm" fontWeight="medium" color="text">
                {nowPlaying.title}
              </Box>
              <Box truncate fontSize="xs" color="textMuted" mt="1">
                {nowPlaying.author?.name ?? "Unknown"}
                {nowPlaying.requester && <Box as="span" ml="2">• @{nowPlaying.requester}</Box>}
              </Box>
            </Box>
          </Flex>
        ) : (
          <Box rounded="xl" borderWidth="1px" borderColor="borderSubtle" bg="surface2Subtle" p="4" textAlign="center">
            <Text fontSize="sm" color="textMuted">
              No track playing
            </Text>
          </Box>
        )}
      </Flex>

      {/* Queue header */}
      <Flex align="center" justify="space-between" borderTopWidth="1px" borderColor="border" pt="4">
        <Heading as="h4" fontSize="sm" fontWeight="semibold" color="text">
          Queue
        </Heading>
        <Text as="span" fontSize="xs" color="textMuted" bg="surface2" px="2" py="1" rounded="full">
          {queue.length} {queue.length === 1 ? "track" : "tracks"}
        </Text>
      </Flex>

      {/* Queue list */}
      <Flex as="ul" className="scrollbar" direction="column" gap="2" overflowY="auto" pr="2" maxH="50vh">
        {queue.length > 0 ? (
          queue.map((t, index) => (
            <Flex
              as="li"
              key={t.id}
              align="center"
              gap="3"
              rounded="xl"
              borderWidth="1px"
              borderColor="border"
              bg="surface2"
              p="3"
              transition="border-color 0.15s ease"
              _hover={{ borderColor: "highlight" }}
            >
              <Box flexShrink={0} w="6" fontSize="xs" color="textMuted" fontWeight="medium">
                {index + 1}
              </Box>
              {t.thumb && (
                <Box position="relative" h="12" w="12" flexShrink={0} overflow="hidden" rounded="lg">
                  <Image src={t.thumb} alt={t.title} fill style={{ objectFit: "cover" }} />
                </Box>
              )}
              <Box minW="0" flex="1">
                <Box truncate fontSize="sm" fontWeight="medium" color="text">
                  {t.title}
                </Box>
                <Box truncate fontSize="xs" color="textMuted" mt="0.5">
                  {t.author?.name ?? "Unknown"}
                  {t.requester && <Box as="span" ml="2">• @{t.requester}</Box>}
                </Box>
              </Box>
            </Flex>
          ))
        ) : (
          <Box as="li" textAlign="center" py="8" rounded="xl" borderWidth="1px" borderColor="borderSubtle" bg="surface2Subtle">
            <Text fontSize="sm" color="textMuted">
              Queue is empty
            </Text>
            <Text fontSize="xs" color="textMuted" mt="1">
              Add tracks using the search button
            </Text>
          </Box>
        )}
      </Flex>
    </Flex>
  );
}
