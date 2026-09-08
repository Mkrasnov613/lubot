import { Box, Flex } from "@chakra-ui/react";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { SidebarProvider } from "@/components/SidebarContext";
import PlayerPanel from "@/app/[slug]/music/components/PlayerPanel";

export const AuthorizedRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <SidebarProvider>
      <Flex as="main" h="100dvh" w="100%" overflow="hidden">
        <AppSidebar />

        <Flex direction="column" flex="1" minW="0">
          <AppHeader />

          <Box
            flex="1"
            minW="0"
            overflowY="auto"
            className="scrollbar"
            px={{ base: "4", md: "8" }}
            py={{ base: "4", md: "6" }}
          >
            {children}
          </Box>

          {/*
          // Removed PlayerPanel from the bottom of the page to avoid layout issues, player panel is not integrated properly yet.
          // It will be added back in once the player panel is fully functional and integrated into the layout.
          <Box flexShrink={0} borderTopWidth="1px" borderColor="border">
            <PlayerPanel />
          </Box>
          */}
        </Flex>
      </Flex>
    </SidebarProvider>
  );
};
