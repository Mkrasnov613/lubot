import SideNav from "@/components/Header";
import ActivityFeedComponent from "@/components/ActivityFeedComponent";
import NavBar from "@/components/NavBar";
import PlayerPanel from "@/components/MusicPlayer/PlayerPanel";
import { Box, Flex } from "@chakra-ui/react";

export default function Layout({ children }: LayoutProps<"/[slug]">) {
  return (
    <Flex
      as="main"
      direction="column"
      justify="space-between"
      align="center"
      w="100vw"
      h={{ lg: "100vh" }}
      overflow="hidden"
    >
      <SideNav />
      <Flex maxW="1820px" mx="auto" gap="5" px="8" py="4" justify="center" align="flex-start">
        <Box flex="1" minW="1285px">
          {children}
        </Box>

        <Flex direction="column" justify="space-between" align="center" minH="635px">
          <ActivityFeedComponent />
          <NavBar />
        </Flex>
      </Flex>
      <Box w="1740px">
        <PlayerPanel />
      </Box>
    </Flex>
  );
}
