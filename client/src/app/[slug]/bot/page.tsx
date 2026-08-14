import NukeWordsSettings from "@/components/BotPage/NukeWordsSettings";
import BotConnectionWindow from "@/components/BotPage/BotConnectionWindow";

export default async function BotPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // ─── UI ───
  return (
    <div className="flex flex-col items-center justify-center gap-5 px-4 py-8 bg-bg1">
      <BotConnectionWindow />
      <NukeWordsSettings />
    </div>
  );
}
