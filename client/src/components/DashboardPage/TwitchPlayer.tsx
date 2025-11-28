export default function TwitchPlayer({slug} : {slug: string}) {
  return (<iframe
    src={`https://player.twitch.tv/?channel=${slug}&parent=localhost&muted=true`}
    height="567"
    width="1280"
    >
</iframe>)
}