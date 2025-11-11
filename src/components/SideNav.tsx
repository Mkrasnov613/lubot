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
    <aside className="fixed bg-gradient-to-b from-bg2 to-bg3 min-w-60 h-screen flex flex-col justify-between items-start border-border border-r-1 overflow-hidden">
      <div className="flex flex-col flex-1 gap-12 w-full">
        <div className="flex items-center gap-5 border-b border-highlight p-2">
          <Image src="/logo.png" width={72} height={72} alt="" />
          <div className="text-twitch font-bold text-4xl">Lu.bot</div>
        </div>

        <nav className="flex-1">
          <ul className="flex flex-col cursor-pointer justify-start gap-2 items-stretch text-text h-full">
            {links.map(({ path, Icon, text }) => (
              <li key={path} className="">
                <NavLinkButton path={path} text={text} img={<Icon size={32}/> } />
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <SideNavFooter slug={slug!.toString()} />
    </aside>
  );
}
