"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import LayoutDashboard from "lucide-react/dist/esm/icons/layout-dashboard.js";
import Music2 from "lucide-react/dist/esm/icons/music-2.js";
import PanelLeftClose from "lucide-react/dist/esm/icons/panel-left-close.js";
import PanelLeftOpen from "lucide-react/dist/esm/icons/panel-left-open.js";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check.js";
import X from "lucide-react/dist/esm/icons/x.js";
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
        bg="rgba(10, 11, 13, 0.7)"
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
        transition="transform 0.22s ease"
        borderRightWidth="1px"
        borderColor="edge"
        bg="chassis"
      >
        {/* Brand row — matches the header's height and divider so the logo
            lines up exactly with the page title across the seam. */}
        <Flex
          align="center"
          gap="2.5"
          h="var(--topbar-h)"
          px={{ base: "3", md: collapsed ? "0" : "3" }}
          flexShrink={0}
          borderBottomWidth="1px"
          borderColor="edge"
          justify={railJustify}
        >
          <Flex align="center" gap="2.5" display={labelDisplay} minW="0">
            <Image src="/logo.png" width={26} height={26} alt="" />
            <Text fontWeight="semibold" fontSize="md" truncate>
              LuBot
            </Text>
          </Flex>

          {/* Collapse toggle — desktop. */}
          <IconButton
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            variant="ghost"
            size="sm"
            flexShrink={0}
            ml={{ base: "auto", md: collapsed ? "0" : "auto" }}
            hideBelow="md"
            onClick={toggleCollapsed}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )}
          </IconButton>

          {/* Close drawer — mobile. */}
          <IconButton
            aria-label="Close menu"
            variant="ghost"
            size="sm"
            flexShrink={0}
            ml="auto"
            hideFrom="md"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </IconButton>
        </Flex>

        <Flex
          as="nav"
          direction="column"
          flex="1"
          py="2"
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
                aria-current={isActive ? "page" : undefined}
              >
                <Flex
                  align="center"
                  gap="2.5"
                  h="36px"
                  px="3"
                  fontSize="sm"
                  fontWeight={isActive ? "semibold" : "regular"}
                  justify={railJustify}
                  borderLeftWidth="2px"
                  borderLeftColor={isActive ? "signal" : "transparent"}
                  color={isActive ? "signalText" : "engrave"}
                  bg={isActive ? "signalTint" : "transparent"}
                  transition="background-color 0.12s ease, color 0.12s ease"
                  textDecoration="none"
                  _hover={
                    isActive ? undefined : { bg: "tintHover", color: "text" }
                  }
                >
                  <Box flexShrink={0} lineHeight="0">
                    <Icon size={17} />
                  </Box>
                  <Text display={labelDisplay} truncate>
                    {label}
                  </Text>
                </Flex>
              </Link>
            );
          })}
        </Flex>

        <Box
          px={collapsed ? "1" : "2"}
          py="2"
          flexShrink={0}
          borderTopWidth="1px"
          borderColor="seam"
        >
          <SideNavFooter slug={slug!.toString()} collapsed={collapsed} />
        </Box>
      </Flex>
    </>
  );
}
