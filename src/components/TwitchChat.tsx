export default async function TwitchChat({ slug }: { slug: string }) {
  return (
    <iframe
      src={`https://www.twitch.tv/embed/${slug}/chat?parent=localhost&darkpopout=1`}
      height={360}
      width={350}
    ></iframe>
  );
}
