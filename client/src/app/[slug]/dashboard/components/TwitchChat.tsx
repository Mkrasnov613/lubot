import { Box } from "@chakra-ui/react";

export default async function TwitchChat({ slug }: { slug: string }) {
  return (
    <Box bg="surface" p="5" rounded="2xl" borderWidth="1px" borderColor="border" position="relative" zIndex={50}>
      <iframe
        src={`https://www.twitch.tv/embed/${slug}/chat?parent=localhost&darkpopout=1`}
        height={580}
        width={420}
      ></iframe>
    </Box>
  );
}
