"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Music2,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  X,
} from "lucide-react";
import SideNavFooter from "@/components/SideNavFooter";
import { useSidebar } from "@/components/SidebarContext";
import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  label: string;
  segment: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", segment: "dashboard", icon: LayoutDashboard },
  { label: "Song requests", segment: "music", icon: Music2 },
  { label: "Moderation", segment: "bot", icon: ShieldCheck },
];

export default function AppSidebar() {
  const { slug } = useParams();
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } =
    useSidebar();

  // Collapsed is a desktop-only affordance — the mobile drawer is always full width.
  const railJustify = {
    base: "flex-start",
    md: collapsed ? "center" : "flex-start",
  } as const;
  const labelDisplay = {
    base: "flex",
    md: collapsed ? "none" : "flex",
  } as const;

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Lock body scroll while the mobile drawer is open so touch scrolling
  // doesn't bleed through the backdrop to the page underneath.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Backdrop — mobile only, dismisses the drawer on tap. */}
      <Box
        hideFrom="md"
        position="fixed"
        inset="0"
        zIndex="overlay"
        bg="blackAlpha.600"
        opacity={mobileOpen ? 1 : 0}
        pointerEvents={mobileOpen ? "auto" : "none"}
        transition="opacity 0.2s ease"
        onClick={() => setMobileOpen(false)}
      />

      <Flex
        as="aside"
        direction="column"
        position={{ base: "fixed", md: "relative" }}
        zIndex={{ base: "modal", md: "auto" }}
        top="0"
        left="0"
        h="100%"
        w={{
          base: "var(--sidebar-w)",
          md: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)",
        }}
        maxW="85vw"
        flexShrink={0}
        transform={{
          base: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          md: "none",
        }}
        transition="transform 0.25s ease"
        borderRightWidth="1px"
        borderColor="border"
        bg="surface"
      >
        {/* Brand row — same height + divider as AppHeader so the logo
            lines up with the page title. */}
        <Flex
          align="center"
          gap="3"
          h="var(--topbar-h)"
          px={{ base: "4", md: collapsed ? "0" : "4" }}
          flexShrink={0}
          borderBottomWidth="1px"
          borderColor="border"
          justify={railJustify}
        >
          <Flex align="center" gap="3" display={labelDisplay} minW="0">
            <Image src="/logo.png" width={36} height={36} alt="" />
            <Text fontWeight="semibold" fontSize="lg" truncate>
              LuBot
            </Text>
          </Flex>

          {/* Collapse toggle - desktop */}
          <IconButton
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            variant="ghost"
            size="sm"
            color="textMuted"
            flexShrink={0}
            ml={{ base: "auto", md: collapsed ? "0" : "auto" }}
            hideBelow="md"
            _hover={{ bg: "surface2", color: "text" }}
            onClick={toggleCollapsed}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </IconButton>

          {/* Close drawer - mobile. */}
          <IconButton
            aria-label="Close menu"
            variant="ghost"
            size="sm"
            color="textMuted"
            flexShrink={0}
            ml="auto"
            hideFrom="md"
            _hover={{ bg: "surface2", color: "text" }}
            onClick={() => setMobileOpen(false)}
          >
            <X size={24} />
          </IconButton>
        </Flex>

        <Flex
          as="nav"
          direction="column"
          gap="1"
          flex="1"
          px="2"
          py="4"
          overflowY="auto"
          className="scrollbar"
        >
          {NAV_ITEMS.map(({ label, segment, icon: Icon }) => {
            const href = `/${slug}/${segment}`;
            const isActive = pathname === href;
            return (
              <Link
                key={segment}
                href={href}
                title={collapsed ? label : undefined}
              >
                <Flex
                  align="center"
                  gap="3"
                  px="2"
                  py="2.5"
                  rounded="md"
                  fontWeight="medium"
                  justify={railJustify}
                  color={isActive ? "accent" : "text"}
                  borderColor={"transparent"}
                  bg={isActive ? "accentEmphasis/50" : "transparent"}
                  transition="all 0.15s ease"
                  _hover={isActive ? undefined : { bg: "surface2" }}
                >
                  <Box flexShrink={0} lineHeight="0">
                    <Icon size={18} />
                  </Box>
                  <Text display={labelDisplay} truncate>
                    {label}
                  </Text>
                </Flex>
              </Link>
            );
          })}
        </Flex>

        <Box px="3" pt="2" pb="5" flexShrink={0}>
          <SideNavFooter slug={slug!.toString()} collapsed={collapsed} />
        </Box>
      </Flex>
    </>
  );
}
