import TwitchChannelComponent from "@/components/DashboardPage/TwitchChannelComponent";
import { Suspense } from "react";
import TwitchChat from "@/components/DashboardPage/TwitchChat";
import TwitchChannelComponentSkeleton from "@/components/DashboardPage/TwitchChannelComponentSkeleton";
import TwitchChatSkeleton from "@/components/DashboardPage/TwitchChatSkeleton";

type DashboardPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params;

  return (
    <div className="flex flex-row gap-5">
      <Suspense fallback={<TwitchChannelComponentSkeleton />}>
        <TwitchChannelComponent slug={slug} />
      </Suspense>
      <Suspense fallback={<TwitchChatSkeleton />}>
        <TwitchChat slug={slug} />
      </Suspense>
    </div>
  );
}
