"use client";

import { usePathname } from "next/navigation";
import Menu from "lucide-react/dist/esm/icons/menu.js";
import { Flex, Heading, IconButton } from "@chakra-ui/react";
import { appRoutes } from "@/lib/appRoutes";
import { useSidebar } from "@/components/SidebarContext";
import TallyLight from "@/components/TallyLight";

const titleByPage = {
  [appRoutes.dashboard]: "Dashboard",
  [appRoutes.music]: "Song requests",
  [appRoutes.bot]: "Moderation",
};

export default function AppHeader() {
  const pathname = usePathname();
  const { toggleMobile } = useSidebar();
  const segment = pathname.split("/").filter(Boolean).at(-1) ?? "";
  const title = titleByPage[`/${segment}`];

  return (
    <Flex
      as="header"
      flexShrink={0}
      align="center"
      gap="2"
      h="var(--topbar-h)"
      px={{ base: "3", md: "4" }}
      bg="chassis"
      borderBottomWidth="1px"
      borderColor="edge"
    >
      <IconButton
        aria-label="Open menu"
        variant="ghost"
        size="sm"
        hideFrom="md"
        onClick={toggleMobile}
      >
        <Menu size={18} />
      </IconButton>

      <Heading as="h1" fontSize="lg" fontWeight="medium" truncate>
        {title}
      </Heading>

      {/* The tally sits top-right, the same corner a streamer's own overlay
          preview usually occupies, so it lands in peripheral vision. */}
      <Flex ml="auto" align="center" flexShrink={0}>
        <TallyLight />
      </Flex>
    </Flex>
  );
}
