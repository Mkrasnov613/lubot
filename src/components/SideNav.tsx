"use client";

import Image from "next/image";
import NavLinkButton from "./NavLinkButton";
import SideNavFooter from "./SIdeNavFooter";
import { LayoutDashboard, Bot, Music } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "next/navigation";

export default function SideNav() {
  const { slug } = useParams();
  const links = useMemo(
    () => [
      { path: `/${slug}/dashboard`, text: "Dashboard", Icon: LayoutDashboard },
      { path: `/${slug}/bot`, text: "Bot", Icon: Bot },
      { path: `/${slug}/music`, text: "Music Player", Icon: Music },
    ],
    [slug]
  );

  return (
    <aside className="fixed left-10 min-w-60 h-screen flex flex-col justify-between items-start py-5">
      <div className="flex-1 flex flex-col justify-start items-start">
        <div className="flex items-center gap-5">
          <Image src="/logo.png" width={72} height={72} alt="" />
        </div>

        <nav className="rounded-full flex-1 flex flex-col items-start justify-center">
          <ul className="flex flex-col items-start cursor-pointer gap-10 text-text h-1/2">
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
      </div>

      <SideNavFooter slug={slug!.toString()} />
    </aside>
  );
}
