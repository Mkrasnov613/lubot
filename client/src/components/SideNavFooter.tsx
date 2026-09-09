"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import LogOut from "lucide-react/dist/esm/icons/log-out.js";
import { API_BASE_URL } from "@/lib/config";
import { Flex, Box, IconButton, Text } from "@chakra-ui/react";

export default function SideNavFooter({
  slug,
  collapsed = false,
}: {
  slug: string;
  collapsed?: boolean;
}) {
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/data/tenant?data=avatar_url`,
          { cache: "no-store", credentials: "include" },
        );
        if (!res.ok) throw new Error(await res.text());
        const { avatar_url } = await res.json();
        if (!cancelled) setAvatarUrl(avatar_url ?? "");
      } catch (e) {
        console.error("avatar fetch failed:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/twitch/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("logout failed:", e);
    } finally {
      window.location.href = "/";
    }
  }

  // Collapsed is desktop-only; the mobile drawer always shows the full footer.
  const detailsDisplay = {
    base: "flex",
    md: collapsed ? "none" : "flex",
  } as const;

  return (
    <Flex align="center" justify="center" gap="2.5" px="1" py="1" minW="0">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          width={26}
          height={26}
          alt=""
          style={{
            borderRadius: "var(--radius-xs)",
            flexShrink: 0,
          }}
        />
      ) : (
        <Box
          w="26px"
          h="26px"
          rounded="xs"
          bg="inset"
          flexShrink={0}
          aria-hidden="true"
        />
      )}
      <Text
        display={detailsDisplay}
        fontSize="sm"
        color="text"
        truncate
        minW="0"
      >
        {slug}
      </Text>
      <IconButton
        display={detailsDisplay}
        aria-label="Log out"
        variant="ghost"
        size="sm"
        ml="auto"
        flexShrink={0}
        onClick={logout}
      >
        <LogOut size={15} />
      </IconButton>
    </Flex>
  );
}
