"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Flex, Heading, IconButton } from "@chakra-ui/react";
import { appRoutes } from "@/lib/appRoutes";
import { useSidebar } from "@/components/SidebarContext";

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
      px={{ base: "4", md: "8" }}
      borderBottomWidth="1px"
      borderColor="border"
    >
      <IconButton
        aria-label="Open menu"
        variant="ghost"
        size="sm"
        ml="-2"
        hideFrom="md"
        onClick={toggleMobile}
      >
        <Menu size={20} />
      </IconButton>
      <Heading as="h1" fontSize="xl" fontWeight="medium">
        {title}
      </Heading>
    </Flex>
  );
}
