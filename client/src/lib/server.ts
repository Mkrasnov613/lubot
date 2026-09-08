// lib/server.ts (server-only)
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/config";

export async function getTenantAvatar() {
  const sid = (await cookies()).get("sid")?.value;

  const r = await fetch(
    `${API_BASE_URL}/api/data/tenant?data=avatar_url`,
    {
      headers: { cookie: `sid=${sid}` },
      cache: "no-store",
    }
  );

  if (!r.ok) {
    console.error("avatar fetch failed", r.status, await r.text());
    return "";
  }

  const { avatar_url } = await r.json();
  return avatar_url as string;
}

export async function getTenantSlug() {
  const sid = (await cookies()).get("sid")?.value;

  const r = await fetch(`${API_BASE_URL}/api/data/tenant?data=slug`, {
    headers: { cookie: `sid=${sid}` },
    cache: "no-store",
  });

  if (!r.ok) {
    console.error("avatar fetch failed", r.status, await r.text());
    return "";
  }

  const { slug } = await r.json();
  return slug;
}
