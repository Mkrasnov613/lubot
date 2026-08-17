"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import SideNavFooter from "./SIdeNavFooter";
import { Flex } from "@chakra-ui/react";

export default function Header() {
  const { slug } = useParams();

  return (
    <Flex as="aside" align="center" w="100%" py="5" px="10">
      <Flex flex="1" justify="flex-start" align="flex-start">
        <Flex align="center" gap="5">
          <Image src="/logo.png" width={72} height={72} alt="" />
        </Flex>
      </Flex>

      <SideNavFooter slug={slug!.toString()} />
    </Flex>
  );
}
