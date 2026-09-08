import TwitchChannelComponent from "@/app/[slug]/dashboard/components/TwitchChannelComponent";
import { Suspense } from "react";
import TwitchChat from "@/app/[slug]/dashboard/components/TwitchChat";
import TwitchChannelComponentSkeleton from "@/app/[slug]/dashboard/components/TwitchChannelComponentSkeleton";
import TwitchChatSkeleton from "@/app/[slug]/dashboard/components/TwitchChatSkeleton";
import ActivityFeedComponent from "@/components/ActivityFeedComponent";
import { Flex } from "@chakra-ui/react";

type DashboardPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params;

  return (
    <Flex direction="row" gap="5" align="flex-start">
      <Suspense fallback={<TwitchChannelComponentSkeleton />}>
        <TwitchChannelComponent slug={slug} />
      </Suspense>
      <Suspense fallback={<TwitchChatSkeleton />}>
        <TwitchChat slug={slug} />
      </Suspense>
      <ActivityFeedComponent />
    </Flex>
  );
}
