import { Box, Flex } from "@chakra-ui/react";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { SidebarProvider } from "@/components/SidebarContext";

export const AuthorizedRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <SidebarProvider>
      <Flex as="main" h="100dvh" w="100%" overflow="hidden" bg="ground">
        <AppSidebar />

        <Flex direction="column" flex="1" minW="0">
          <AppHeader />

          {/* The ground shows between panels — that gap is what makes them
              read as separate rack units, so the padding here is part of the
              design rather than incidental spacing. */}
          <Box
            flex="1"
            minW="0"
            overflowY="auto"
            className="scrollbar"
            p="var(--panel-gap)"
          >
            {children}
          </Box>
        </Flex>
      </Flex>
    </SidebarProvider>
  );
};
