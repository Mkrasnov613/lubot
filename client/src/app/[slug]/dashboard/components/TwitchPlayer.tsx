import { Box } from "@chakra-ui/react";

export default function TwitchPlayer({ slug }: { slug: string }) {
  return (
    /* Fixed 760×480 before, which is what forced the whole dashboard to a
       minimum of ~1700px. A 16:9 box lets the player carry the column, and
       the height cap keeps the activity feed on screen without scrolling —
       on a second monitor, what just happened matters more than a bigger
       preview of what you're already looking at. */
    <Box
      position="relative"
      w="100%"
      aspectRatio="16 / 9"
      maxH="46vh"
      bg="video"
      rounded="xs"
      overflow="hidden"
    >
      <iframe
        title="Stream preview"
        src={`https://player.twitch.tv/?channel=${slug}&parent=localhost&muted=true`}
        allowFullScreen
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
        }}
      />
    </Box>
  );
}
