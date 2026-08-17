"use client";
import { LayoutDashboard, Bot, Music } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Flex } from "@chakra-ui/react";

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
    <Flex as="nav" rounded="full" align="flex-start" justify="center">
      <Flex as="ul" align="flex-start" cursor="pointer" gap="10" color="text">
        {links.map(({ path, Icon, text }) => (
          <NavLinkButton
            key={path}
            path={path}
            text={text}
            img={<Icon size={32} />}
          />
        ))}
      </Flex>
    </Flex>
  );
}
