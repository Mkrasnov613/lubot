import { ActivityItem } from "@/app/[slug]/dashboard/page";
export function formatMin(sec: number) {
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}

export function formatTime(sec: number) {
  if (!sec || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function timeAgo(input: string | number | Date) {
  const d = new Date(input).getTime();
  const diffSec = Math.floor((Date.now() - d) / 1000);

  const minute = 60;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diffSec < 30) return "just now";
  if (diffSec < minute) return `${diffSec}s ago`;
  if (diffSec < hour)   return `${Math.floor(diffSec / minute)} min ago`;
  if (diffSec < day)    return `${Math.floor(diffSec / hour)} h ago`;
  if (diffSec < week)   return `${Math.floor(diffSec / day)} d ago`;
  return `${Math.floor(diffSec / week)} w ago`;
}