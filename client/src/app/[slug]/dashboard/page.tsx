import { Suspense } from "react";
import { Flex, Grid, GridItem } from "@chakra-ui/react";
import TwitchChannelComponent from "@/app/[slug]/dashboard/components/TwitchChannelComponent";
import TwitchChat from "@/app/[slug]/dashboard/components/TwitchChat";
import TwitchChannelComponentSkeleton from "@/app/[slug]/dashboard/components/TwitchChannelComponentSkeleton";
import TwitchChatSkeleton from "@/app/[slug]/dashboard/components/TwitchChatSkeleton";
import ActivityFeedComponent from "@/components/ActivityFeedComponent";

type DashboardPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params;

  return (
    /* Two racks: the broadcast column carries what you change while live, the
       chat column stays put beside it. Below xl they stack, chat last —
       Twitch's own app is the better place to read chat on a small screen. */
    <Grid
      gap="var(--panel-gap)"
      alignItems="start"
      templateColumns={{ base: "1fr", xl: "minmax(0, 1fr) 340px" }}
    >
      <GridItem minW="0">
        <Flex direction="column" gap="var(--panel-gap)">
          <Suspense fallback={<TwitchChannelComponentSkeleton />}>
            <TwitchChannelComponent slug={slug} />
          </Suspense>
          <ActivityFeedComponent />
        </Flex>
      </GridItem>

      <GridItem minW="0">
        <Suspense fallback={<TwitchChatSkeleton />}>
          <TwitchChat slug={slug} />
        </Suspense>
      </GridItem>
    </Grid>
  );
}
