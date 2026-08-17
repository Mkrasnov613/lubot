"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { showToast } from "@/lib/toast";
import { API_BASE_URL } from "@/lib/config";
import { Box, Flex, Input, Button, Text, chakra } from "@chakra-ui/react";

type Props = {
  initialTitle: string;
  initialGame: string;
  updateStream: any; // server action
};

type GameItem = { id: string; name: string; boxArtUrl?: string };

export default function EditStreamMeta({
  initialTitle,
  initialGame,
  updateStream,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialTitle);
  const [gameName, setGameName] = useState(initialGame);
  const [gameId, setGameId] = useState<string | null>(null);

  const [results, setResults] = useState<GameItem[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [searching, setSearching] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const debouncedQuery = useDebouncedValue(gameName, 300);

  const controllerRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  // Debounced fetch to internal API
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setSearching(true);
    controllerRef.current?.abort();
    const ac = new AbortController();
    controllerRef.current = ac;

    fetch(
      `${API_BASE_URL}/api/twitch/search/categories?category=${encodeURIComponent(
        q,
      )}`,
      {
        signal: ac.signal,
        cache: "no-store",
        credentials: "include",
      },
    )
      .then(async (r) => (r.ok ? r.json() : Promise.reject(await r.text())))
      .then((json) => {
        const data: GameItem[] = json.data ?? [];
        setResults(data);
        setOpen(data.length > 0);
        setHighlight(0);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("Search error", err);
          setResults([]);
          setOpen(false);
        }
      })
      .finally(() => setSearching(false));

    return () => ac.abort();
  }, [debouncedQuery]);

  function pickGame(item: GameItem) {
    setGameName(item.name);
    setGameId(item.id);
    setIsSelected(true);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
      scrollIntoView(highlight + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
      scrollIntoView(highlight - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pickGame(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function scrollIntoView(idx: number) {
    const el = listRef.current?.children?.[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      formData.set("title", title);
      formData.set("game", gameName);
      if (gameId) formData.set("gameId", gameId);

      const result = await updateStream(formData);

      if (result.ok) {
        showToast({
          status: "success",
          title: "The stream's info was successfully updated",
          description: `${title} — ${gameName} `,
        });
        setEditing(false);
      } else {
        showToast({
          status: "error",
          title: `Failed to update stream: ${result?.message}`,
        });
        // keep editing open for correction
      }
    });
  }

  if (!editing) {
    return (
      <Flex align="center" gap="3">
        <Box>
          <Box maxW="32.5rem" style={{ wordBreak: "break-word" }}>
            {title}
          </Box>
          <Box color="twitch">{gameName}</Box>
        </Box>
        <Button type="button" onClick={() => setEditing(true)} variant="secondary" size="sm">
          Edit
        </Button>
      </Flex>
    );
  }

  return (
    <chakra.form action={onSubmit} display="flex" alignItems="flex-end" gap="2" position="relative">
      <Box as="label" display="flex" flexDir="column">
        <Text fontSize="sm" opacity={0.8}>
          Title
        </Text>
        <Input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          bg="surface2"
          borderWidth="1px"
          borderColor="border"
          px="3"
          py="2"
          rounded="lg"
          outline="none"
        />
      </Box>

      <Box as="label" display="flex" flexDir="column" position="relative">
        <Text fontSize="sm" opacity={0.8}>
          Game
        </Text>
        <Input
          name="game"
          value={gameName}
          onChange={(e) => {
            setGameName(e.target.value);
            setGameId(null); // reset if user starts typing
            setOpen(true);
            setIsSelected(false);
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          bg="surface2"
          borderWidth="1px"
          borderColor="border"
          px="3"
          py="2"
          rounded="lg"
          outline="none"
        />
        {/* ensure id is sent if selected */}
        {gameId && <input type="hidden" name="gameId" value={gameId} />}

        {open && results.length > 0 && (
          <Box
            as="ul"
            ref={listRef}
            position="absolute"
            top="100%"
            mt="1"
            zIndex={20}
            maxH="10.5rem"
            w="100%"
            overflow="auto"
            rounded="lg"
            borderWidth="1px"
            borderColor="border"
            bg="surface"
            boxShadow="xl"
          >
            {results.map((g, i) => (
              <Box as="li" key={g.id}>
                <chakra.button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickGame(g);
                  }}
                  onMouseOver={() => setHighlight(i)}
                  display="flex"
                  alignItems="center"
                  w="100%"
                  gap="3"
                  px="3"
                  py="2"
                  bg={i === highlight ? "surface2" : undefined}
                >
                  {g.boxArtUrl ? (
                    <img
                      src={g.boxArtUrl}
                      alt=""
                      width={26}
                      height={36}
                      style={{ borderRadius: "0.375rem" }}
                    />
                  ) : (
                    <Box w="26px" h="36px" rounded="md" bg="surface2" />
                  )}
                  <Text>{g.name}</Text>
                </chakra.button>
              </Box>
            ))}
          </Box>
        )}
        {open && searching && results.length === 0 && (
          <Box
            position="absolute"
            top="100%"
            mt="1"
            zIndex={20}
            w="100%"
            px="3"
            py="2"
            rounded="lg"
            borderWidth="1px"
            borderColor="border"
            bg="surface"
            boxShadow="xl"
            fontSize="sm"
            opacity={0.8}
          >
            Searching…
          </Box>
        )}
      </Box>

      <Flex justify="center" align="flex-end" gap="2">
        <Button type="submit" disabled={!isSelected} variant="twitch" size="md">
          {isPending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" onClick={() => setEditing(false)} variant="secondary" size="md">
          Cancel
        </Button>
      </Flex>
    </chakra.form>
  );
}
