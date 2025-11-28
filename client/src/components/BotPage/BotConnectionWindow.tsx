export default function BotConnectionWindow({ slug }: { slug: string }) {
  return (
    <p className="text-muted">
      LuBot automatically joins your channel after you log in with Twitch. Use
      commands like <span className="font-mono bg-bg3 px-1 rounded">!sr</span>,
      <span className="font-mono bg-bg3 px-1 rounded">!song</span>, and
      <span className="font-mono bg-bg3 px-1 rounded">!queue</span>.
    </p>
  );
}
