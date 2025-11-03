'use client';

import Image from 'next/image';
import NavLinkButton from './NavLinkButton';
import SideNavFooter from './SIdeNavFooter';
import { LayoutDashboard, Bot, Music } from 'lucide-react';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';

export default function SideNav() {
  const {slug} = useParams()
  const links = useMemo(
    () => [
      { path: `/${slug}/dashboard`, Icon: LayoutDashboard },
      { path: `/${slug}/bot`, Icon: Bot },
      { path: `/${slug}/music`,  Icon: Music },
    ],
    [slug]
  );

  return (
    <aside className="bg-gradient-to-b from-bg2 to-bg3 w-20 h-screen flex flex-col justify-between items-center border-border border-r-1 overflow-hidden">
      <div className="flex flex-col flex-1 gap-12">
        <div className="flex items-center gap-15 w-full border-b border-highlight shadow-large p-2">
          <Image src="/logo.png" width={72} height={72} alt="" />
        </div>

        <nav className="flex-1">
          <ul className="flex flex-col justify-start gap-10 items-center text-text h-full">
            {links.map(({ path, Icon }) => (
              <li key={path}>
                <NavLinkButton path={path} img={<Icon size={32} />} />
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <SideNavFooter slug={slug!.toString()} />
    </aside>
  );
}
