import { Box } from "@chakra-ui/react";
import Panel from "@/components/Panel";

export default async function TwitchChat({ slug }: { slug: string }) {
  return (
    <Panel label="Chat" flush>
      {/* Twitch's embed is an iframe we can't style, so it's the one surface
          in the app that isn't ours. `darkpopout` is us configuring their UI
          to sit closest to the chassis, not theming our own component. */}
      <Box h={{ base: "420px", xl: "calc(100dvh - var(--topbar-h) - 92px)" }}>
        <iframe
          title={`${slug} chat`}
          src={`https://www.twitch.tv/embed/${slug}/chat?parent=localhost&darkpopout=1`}
          style={{ width: "100%", height: "100%", border: 0, display: "block" }}
        />
      </Box>
    </Panel>
  );
}
