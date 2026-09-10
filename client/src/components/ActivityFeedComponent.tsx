import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import LiveEventFeed from "./LiveEventFeed";
import LiveEventFeedSkeleton from "./LiveEventFeedSkeleton";
import { SERVER_ORIGIN } from "@/lib/config";

type ActivityItemType = "follow" | "sub";
export type ActivityItem = {
  id: string;
  user_id: string;
  user_name: string;
  profile_image_url: string;
  type: ActivityItemType;
  occurred_at: string; // ISO string used for sorting + timeAgo
};

export default async function ActivityFeedComponent() {
  const cookieHeader = (await cookies()).toString();

  const followersResponse = await fetch(
    `${SERVER_ORIGIN}/api/twitch/followers`,
    {
      cache: "no-store",
      headers: { cookie: cookieHeader },
    }
  );

  if (followersResponse.status === 401) {
    redirect("/");
  }

  if (!followersResponse.ok) {
    const txt = await followersResponse.text();
    throw new Error(
      `/api/twitch/followers failed: ${followersResponse.status} ${txt}`
    );
  }

  const { activity }: { activity: ActivityItem[] } =
    await followersResponse.json();
  return (
    <Suspense fallback={<LiveEventFeedSkeleton />}>
      <LiveEventFeed initialData={activity} />
    </Suspense>
  );
}
