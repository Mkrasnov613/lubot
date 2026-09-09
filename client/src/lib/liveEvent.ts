import type { ActivityItem } from "@/components/ActivityFeedComponent";
import { API_BASE_URL } from "@/lib/config";

const sortByTimeDesc = (a: ActivityItem, b: ActivityItem) =>
  new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();

export function pushActivityItem(
  base: Omit<ActivityItem, "profile_image_url">,
  setItems: React.Dispatch<React.SetStateAction<ActivityItem[]>>
) {
  fetch(`${API_BASE_URL}/api/twitch/followers?follower=${base.user_id}`, {
    credentials: "include",
  })
    .then((res) => res.json())
    .then(({ profile_image_url }) => {
      const avatar = profile_image_url || "/default-avatar.png";

      setItems((prev) =>
        [
          {
            ...base,
            profile_image_url: avatar,
          },
          ...prev,
        ]
          .sort(sortByTimeDesc)
          .slice(0, 50)
      );
    })
    .catch(() => {
      setItems((prev) =>
        [
          {
            ...base,
            profile_image_url: "/default-avatar.png",
          },
          ...prev,
        ]
          .sort(sortByTimeDesc)
          .slice(0, 50)
      );
    });
}