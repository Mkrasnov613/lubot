export default async function TwitchChat({ slug }: { slug: string }) {
  return (
    <div className="bg-bg2 p-5 rounded-2xl border-border border-1 max-w-[500px] relative z-100">
    <iframe
      src={`https://www.twitch.tv/embed/${slug}/chat?parent=localhost&darkpopout=1`}
      height={682}
      width={460}
    ></iframe>
    </div>
  );
}
