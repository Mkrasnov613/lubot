import NukeWordsSettings from "@/components/BotPage/NukeWordsSettings";

export default async function BotPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // ─── UI ───
  return (
    <div className="flex items-center min-h-screen justify-center px-4 py-8 bg-bg1">
      <NukeWordsSettings />
    </div>
  );
}
