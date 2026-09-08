"use client";

import { useEffect, useState } from "react";
import { Bomb } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";
import { Box, Flex, Stack, Input, Button, Text, chakra } from "@chakra-ui/react";

type NukeWord = {
  id: number;
  word: string;
  created_at?: string;
};

export default function NukeWordsSettings() {
  const [words, setWords] = useState<NukeWord[]>([]);
  const [newWord, setNewWord] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/nuke-words`, {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setWords(data.words);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newWord.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/nuke-words`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: newWord }),
      });
      const data = await res.json();
      if (data.success && data.word) {
        setWords((prev) => [data.word, ...prev]);
        setNewWord("");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const prev = words;
    setWords((w) => w.filter((x) => x.id !== id));
    try {
      const res = await fetch(`${API_BASE_URL}/api/nuke-words/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        // rollback on error
        setWords(prev);
      }
    } catch {
      setWords(prev);
    }
  }

  return (
    <Stack position="relative" gap="4" rounded="2xl" borderWidth="1px" borderColor="border" bg="surface" p="4" maxH="9.25rem">
      <Box as="form" onSubmit={handleAdd} position="relative">
        <Input
          placeholder="Blacklist a phrase..."
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          flex="1"
          rounded="xl"
          borderWidth="1px"
          borderColor="border"
          _focus={{ borderColor: "highlight" }}
          bg="bg"
          px="3"
          py="2"
          fontSize="lg"
          outline="none"
          h="3.75rem"
          w="400px"
        />
        <chakra.button
          type="submit"
          disabled={saving || !newWord.trim()}
          position="absolute"
          right="0"
          top="50%"
          style={{ transform: "translateY(-50%)" }}
          roundedRight="xl"
          px="4"
          py="2"
          borderWidth="1px"
          borderColor="highlight"
          fontSize="sm"
          fontWeight="medium"
          h="100%"
          bg="surface2"
          color="white"
          _active={{ bg: "twitch" }}
          _hover={{ bg: "color-mix(in srgb, var(--color-twitch) 50%, transparent)" }}
          _disabled={{ borderWidth: 0, bg: "transparent", opacity: 0.6, cursor: "not-allowed" }}
        >
          <Bomb />
        </chakra.button>
      </Box>

      <Box
        as="button"
        onClick={() => setIsOpen((prev) => !prev)}
        rounded="xl"
        w="40"
        h="10"
        bgGradient="to-b"
        gradientFrom="surface"
        gradientTo="surface2"
        borderWidth="1px"
        borderColor="border"
        transition="all 0.15s ease"
        _hover={{ borderTopColor: "highlight" }}
      >
        {isOpen ? "Hide" : "Show"} Blacklist
      </Box>

      {isOpen && (
        <>
          {loading && <Text>loading...</Text>}
          <Flex
            as="ul"
            className="scrollbar"
            direction="column"
            justify="flex-start"
            position="absolute"
            bottom="-8.75rem"
            right="4"
            gap="2"
            w="50%"
            h="12.5rem"
            rounded="xl"
            borderWidth="1px"
            borderColor="border"
            borderTopColor="highlight"
            overflowY="scroll"
            p="2"
            bgGradient="to-b"
            gradientFrom="surface"
            gradientTo="surface2"
          >
            {words.map((w) => (
              <Flex as="li" key={w.id} align="center" justify="space-between" rounded="xl" bg="bg" px="3" py="2" fontSize="md">
                <Text as="span">{w.word}</Text>
                <Button
                  onClick={() => handleDelete(w.id)}
                  variant="ghost"
                  size="sm"
                  fontSize="xs"
                  color="#f87171"
                  _hover={{ color: "#fca5a5" }}
                >
                  Remove
                </Button>
              </Flex>
            ))}
          </Flex>
        </>
      )}
    </Stack>
  );
}
