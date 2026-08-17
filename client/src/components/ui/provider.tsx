"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { system } from "@/lib/chakra/system";

export function Provider(props: React.PropsWithChildren) {
  return <ChakraProvider value={system}>{props.children}</ChakraProvider>;
}
