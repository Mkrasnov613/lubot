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
        </Flex>
      </Flex>
    </SidebarProvider>
  );
};
