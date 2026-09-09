"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { showToast } from "@/lib/toast";
import { API_BASE_URL } from "@/lib/config";
import { Box, Flex, Input, Button, Text, chakra } from "@chakra-ui/react";

type Props = {
  initialTitle: string;
  initialGame: string;
  updateStream: (formData: FormData) => Promise<{
    ok: boolean;
    message?: string;
  }>;
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
  const debouncedQuery = useDebouncedValue(gameName, 300);

  const controllerRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  /**
   * Save used to require picking a category from the dropdown, so a
   * title-only edit could never be submitted. Anything actually changed is
   * the real condition — a category still has to be picked from the list to
   * count as changed, because Twitch needs its id, not its name.
   */
  const titleChanged = title.trim() !== initialTitle.trim();
  const gameChanged = gameId !== null && gameName.trim() !== initialGame.trim();
  const canSave = (titleChanged || gameChanged) && title.trim().length > 0;

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

  function cancel() {
    setTitle(initialTitle);
    setGameName(initialGame);
    setGameId(null);
    setOpen(false);
    setEditing(false);
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
          title: "Changes saved",
          description: title,
        });
        setEditing(false);
      } else {
        showToast({
          status: "error",
          title: "Twitch wouldn't accept the changes",
          description: result?.message,
        });
        // Stay in edit mode so the streamer can correct and retry.
      }
    });
  }

  if (!editing) {
    return (
      <Flex align="flex-start" gap="3" mt="1">
        <Box minW="0" flex="1">
          <Text fontSize="sm" color="text" lineClamp={2}>
            {title || "No title set"}
          </Text>
          <Text fontSize="xs" color={gameName ? "signalText" : "faint"} truncate>
            {gameName || "No category set"}
          </Text>
        </Box>
        <Button
          type="button"
          onClick={() => setEditing(true)}
          variant="secondary"
          size="sm"
          flexShrink={0}
        >
          Edit
        </Button>
      </Flex>
    );
  }

  return (
    <chakra.form
      action={onSubmit}
      display="flex"
      flexDirection="column"
      gap="2.5"
      mt="2"
      position="relative"
    >
      <Field label="Title">
        <ConsoleInput
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={140}
          autoFocus
        />
      </Field>

      <Field label="Category">
        <Box position="relative">
          <ConsoleInput
            name="game"
            value={gameName}
            onChange={(e) => {
              setGameName(e.target.value);
              setGameId(null); // a typed name isn't a category until it's picked
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
          />

          {gameId && <input type="hidden" name="gameId" value={gameId} />}

          {open && results.length > 0 && (
            <Box
              as="ul"
              ref={listRef}
              position="absolute"
              top="calc(100% + 4px)"
              left="0"
              zIndex={20}
              maxH="220px"
              w="100%"
              overflowY="auto"
              className="scrollbar"
              rounded="sm"
              bg="chassis"
              boxShadow="menu"
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
                    textAlign="left"
                    w="100%"
                    gap="2.5"
                    px="2.5"
                    py="1.5"
                    fontSize="sm"
                    color={i === highlight ? "text" : "engrave"}
                    bg={i === highlight ? "signalTint" : "transparent"}
                  >
                    {g.boxArtUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={g.boxArtUrl}
                        alt=""
                        width={24}
                        height={32}
                        style={{
                          borderRadius: "var(--radius-xs)",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <Box w="24px" h="32px" rounded="xs" bg="inset" flexShrink={0} />
                    )}
                    <Box truncate>{g.name}</Box>
                  </chakra.button>
                </Box>
              ))}
            </Box>
          )}

          {open && searching && results.length === 0 && (
            <Box
              position="absolute"
              top="calc(100% + 4px)"
              left="0"
              zIndex={20}
              w="100%"
              px="2.5"
              py="1.5"
              rounded="sm"
              bg="chassis"
              boxShadow="menu"
              fontSize="sm"
              color="engrave"
            >
              Searching Twitch categories
            </Box>
          )}
        </Box>
      </Field>

      <Flex gap="2" mt="0.5">
        <Button type="submit" disabled={!canSave || isPending} variant="primary" size="sm">
          {isPending ? "Saving" : "Save changes"}
        </Button>
        <Button type="button" onClick={cancel} variant="ghost" size="sm">
          Cancel
        </Button>
      </Flex>
    </chakra.form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box as="label" display="block">
      <Box className="engrave" mb="1">
        {label}
      </Box>
      {children}
    </Box>
  );
}

/** An input set into the chassis: recessed fill, violet edge on focus. */
function ConsoleInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      bg="inset"
      borderWidth="1px"
      borderColor="edge"
      rounded="sm"
      h="32px"
      px="2.5"
      fontSize="sm"
      color="text"
      _placeholder={{ color: "faint" }}
      _hover={{ borderColor: "faint" }}
      _focusVisible={{
        borderColor: "signal",
        outline: "none",
        boxShadow: "0 0 0 1px var(--color-signal)",
      }}
      {...props}
    />
  );
}
