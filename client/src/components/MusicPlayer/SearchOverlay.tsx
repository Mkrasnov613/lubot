"use client";

import { useState, useEffect, useRef } from "react";
import type { SearchItem } from "@/types/SearchItem";
import Image from "next/image";
import { formatMin } from "@/lib/utils";
import { Search } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";
import { Box, Flex, Input, Text } from "@chakra-ui/react";

export default function SearchOverlay({ onClose }: { onClose?: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      abortRef.current?.abort();
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        setError(null);
        const r = await fetch(`/api/search?q=${query}`, {
          signal: ac.signal,
        });
        const data: { items?: SearchItem[] } = await r.json();
        setResults(data.items || []);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError("Search failed");
        }
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(t);
  }, [query]);

  async function enqueueVideo(videoId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/player/enqueue`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, requester: "web" }),
      });
      const data: { error?: string } = await res.json();
      if (data?.error) throw new Error(data.error);
      onClose?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to add track");
      }
    }
  }

  return (
    <Flex direction="column" gap="4" p="6" maxH="80vh">
      <Flex align="center" gap="3">
        <Box flex="1" position="relative">
          <Search
            style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", width: 20, height: 20 }}
            color="var(--color-text-muted)"
          />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search on YouTube…"
            h="12"
            w="100%"
            rounded="xl"
            borderWidth="1px"
            borderColor="border"
            bg="surface2"
            pl="12"
            pr="4"
            fontSize="sm"
            outline="none"
            transition="border-color 0.15s ease"
            _focus={{ borderColor: "highlight" }}
            _placeholder={{ color: "textMuted" }}
          />
        </Box>
      </Flex>

      {loading && (
        <Flex align="center" justify="center" py="8">
          <Text fontSize="sm" color="textMuted">Searching…</Text>
        </Flex>
      )}
      {error && (
        <Box
          px="4"
          py="3"
          rounded="xl"
          bg="color-mix(in srgb, var(--color-danger) 10%, transparent)"
          borderWidth="1px"
          borderColor="color-mix(in srgb, var(--color-danger) 20%, transparent)"
          fontSize="sm"
          color="danger"
        >
          {error}
        </Box>
      )}

      {!loading && !error && query.trim() && results.length === 0 && (
        <Flex align="center" justify="center" py="8">
          <Text fontSize="sm" color="textMuted">No results found</Text>
        </Flex>
      )}

      {!query.trim() && (
        <Flex align="center" justify="center" py="8">
          <Text fontSize="sm" color="textMuted">Start typing to search for music</Text>
        </Flex>
      )}

      <Flex as="ul" className="scrollbar" direction="column" gap="2" overflowY="auto" pr="2">
        {results.map((r) => (
          <Box
            as="li"
            key={r.id}
            className="group"
            position="relative"
            overflow="hidden"
            rounded="xl"
            borderWidth="1px"
            borderColor="border"
            bg="surface2"
            transition="border-color 0.15s ease"
            _hover={{ borderColor: "highlight" }}
          >
            <Flex
              as="button"
              w="100%"
              align="center"
              gap="4"
              p="3"
              textAlign="left"
              transition="background-color 0.15s ease"
              _hover={{ bg: "surface" }}
              onClick={() => enqueueVideo(r.id)}
              title="Add to queue"
            >
              {r.thumb && (
                <Box position="relative" h="16" w="16" flexShrink={0} overflow="hidden" rounded="lg">
                  <Image src={r.thumb} alt={r.title} fill style={{ objectFit: "cover" }} />
                </Box>
              )}
              <Box minW="0" flex="1">
                <Box truncate fontSize="sm" fontWeight="medium" color="text">
                  {r.title}
                </Box>
                <Box truncate fontSize="xs" color="textMuted" mt="1">
                  {r.channel}
                  {r.durationSec && <Box as="span" ml="2">• {formatMin(r.durationSec)}</Box>}
                </Box>
              </Box>
              <Box
                as="span"
                flexShrink={0}
                rounded="lg"
                borderWidth="1px"
                borderColor="border"
                px="3"
                py="1.5"
                fontSize="xs"
                fontWeight="medium"
                color="text"
                transition="all 0.15s ease"
                _groupHover={{ borderColor: "highlight", bg: "color-mix(in srgb, var(--color-accent-700) 10%, transparent)" }}
              >
                Add
              </Box>
            </Flex>
          </Box>
        ))}
      </Flex>
    </Flex>
  );
}
