"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import { Flex, Box, Text } from "@chakra-ui/react";

export default function SideNavFooter({ slug }: { slug: string }) {
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/data/tenant?data=avatar_url`,
          { cache: "no-store", credentials: "include" }
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

  return (
    <Flex h="15%" justify="flex-start" align="center" gap="3">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          width={48}
          height={48}
          alt="avatar"
          style={{ borderRadius: "9999px", alignSelf: "center", boxShadow: "var(--shadow-md)" }}
        />
      ) : (
        <Box
          w="12"
          h="12"
          rounded="full"
          bg="var(--color-neutral-700)"
          alignSelf="center"
          boxShadow="var(--shadow-md)"
          aria-label="No avatar"
        />
      )}
      <Text>{slug}</Text>
    </Flex>
  );
}
