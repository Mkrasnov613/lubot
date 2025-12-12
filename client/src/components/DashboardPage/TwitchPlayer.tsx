export default function TwitchPlayer({slug} : {slug: string}) {
  return (<iframe
    src={`https://player.twitch.tv/?channel=${slug}&parent=localhost&muted=true`}
    height="480"
    width="760"
    >
</iframe>)
}