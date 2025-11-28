import TwitchChannelComponent from "@/components/DashboardPage/TwitchChannelComponent";
import { Suspense } from "react";
import { cookies } from "next/headers";
import LiveEventFeed from "@/components/DashboardPage/LiveEventFeed";
import TwitchChat from "@/components/DashboardPage/TwitchChat";

type DashboardPageProps = {
  params: Promise<{ slug: string }>;
};

type ActivityItemType = "follow" | "sub";
export type ActivityItem = {
  id: string;
  user_id: string;
  user_name: string;
  profile_image_url: string;
  type: ActivityItemType;
  occurred_at: string; // ISO string used for sorting + timeAgo
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params;
  const cookieHeader = (await cookies()).toString();

  const followersResponse = await fetch(
    "http://localhost:3000/api/twitch/followers",
    {
      cache: "no-store",
      headers: { cookie: cookieHeader },
    }
  );

  if (!followersResponse.ok) {
    const txt = await followersResponse.text();
    throw new Error(
      `/api/twitch/followers failed: ${followersResponse.status} ${txt}`
    );
  }

  const { activity }: { activity: ActivityItem[] } =
    await followersResponse.json();

  return (
    <div className="flex flex-col max-w-[1680px] mx-auto gap-6 px-8 py-6 ">
      <div className="flex flex-row justify-between items-start flex-wrap ">
        <Suspense fallback={""}>
          <TwitchChannelComponent slug={slug} />
        </Suspense>
        <Suspense>
          <TwitchChat slug={slug} />
        </Suspense>
      </div>
      <Suspense fallback={""}>
        <LiveEventFeed initialData={activity} />
      </Suspense>
    </div>
  );
}
