"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
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
    <Flex
      direction={{ base: "row", md: collapsed ? "column" : "row" }}
      justify="flex-start"
      align="center"
      gap="3"
      px="1"
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          width={32}
          height={32}
          alt="avatar"
          style={{
            borderRadius: "9999px",
            alignSelf: "center",
            boxShadow: "var(--shadow-md)",
            flexShrink: 0,
          }}
        />
      ) : (
        <Box
          w="10"
          h="10"
          rounded="full"
          bg="var(--color-neutral-700)"
          alignSelf="center"
          boxShadow="var(--shadow-md)"
          flexShrink={0}
          aria-label="No avatar"
        />
      )}
      <Text truncate display={detailsDisplay}>
        {slug}
      </Text>
      <IconButton
        display={detailsDisplay}
        aria-label="Log out"
        variant="ghost"
        size="sm"
        ml="auto"
        onClick={logout}
      >
        <LogOut size={16} />
      </IconButton>
    </Flex>
  );
}
