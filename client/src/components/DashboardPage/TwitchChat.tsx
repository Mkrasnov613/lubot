export default async function TwitchChat({ slug }: { slug: string }) {
  return (
    <div className="bg-bg2 p-5 rounded-2xl border-border border-1  relative z-50">
    <iframe
      src={`https://www.twitch.tv/embed/${slug}/chat?parent=localhost&darkpopout=1`}
      height={580}
      width={420}
    ></iframe>
    </div>
  );
}
