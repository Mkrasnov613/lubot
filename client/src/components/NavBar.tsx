"use client";
import { LayoutDashboard, Bot, Music } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "next/navigation";

import NavLinkButton from "./NavLinkButton";

export default function NavBar() {
  const { slug } = useParams();
  const links = useMemo(
    () => [
      { path: `/${slug}/dashboard`, text: "Dashboard", Icon: LayoutDashboard },
      { path: `/${slug}/bot`, text: "Bot", Icon: Bot },
    ],
    [slug]
  );
  return (
    <nav className="rounded-full flex items-start justify-center">
      <ul className="flex items-start cursor-pointer gap-10 text-text ">
        {links.map(({ path, Icon, text }) => (
          <NavLinkButton
            key={path}
            path={path}
            text={text}
            img={<Icon size={32} />}
          />
        ))}
      </ul>
    </nav>
  );
}
