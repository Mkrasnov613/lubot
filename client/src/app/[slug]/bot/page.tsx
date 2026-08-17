import NukeWordsSettings from "@/app/[slug]/bot/components/NukeWordsSettings";
import BotConnectionWindow from "@/app/[slug]/bot/components/BotConnectionWindow";
import { Flex } from "@chakra-ui/react";

export default async function BotPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // ─── UI ───
  return (
    <Flex direction="column" align="center" justify="center" gap="5" px="4" py="8" bg="bg">
      <BotConnectionWindow />
      <NukeWordsSettings />
    </Flex>
  );
}
