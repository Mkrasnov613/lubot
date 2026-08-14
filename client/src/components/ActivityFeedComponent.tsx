import { cookies } from "next/headers";
import { Suspense } from "react";
import LiveEventFeed from "./LiveEventFeed";
import LiveEventFeedSkeleton from "./LiveEventFeedSkeleton";
import { API_BASE_URL } from "@/lib/config";

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
    `${API_BASE_URL}/api/twitch/followers`,
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
    <Suspense fallback={<LiveEventFeedSkeleton />}>
      <LiveEventFeed initialData={activity} />
    </Suspense>
  );
}
