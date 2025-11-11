"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function SideNavFooter({ slug }: { slug: string }) {
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          "http://localhost:3000/api/data/tenant?data=avatar_url",
          { cache: "no-store", credentials: "include" }
        );
        if (!res.ok) throw new Error(await res.text());
        const { avatar_url } = await res.json();
        if (!cancelled) setAvatarUrl(avatar_url ?? "");
      } catch (e) {
        console.error("avatar fetch failed:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="h-[10%] flex justify-start ml-7 items-center gap-3 w-full mb-2">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          width={48}
          height={48}
          alt="avatar"
          className="rounded-full shadow-large self-center"
        />
      ) : (
        <div
          className="w-12 h-12 rounded-full bg-neutral-700 shadow-large shadow-large self-center"
          aria-label="No avatar"
        />
      )}
      <p>{slug}</p>
    </div>
  );
}
