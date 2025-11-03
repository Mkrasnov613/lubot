import IntroSection from "@/components/IntroSection";
import PlayerPanel from "@/components/PlayerPanel";

export default function MusicPage() {
  return (
    <section className="mx-auto max-w-[1780px] min-h-screen px-6 py-10 text-[var(--color-text)] bg-bg1">
      <div className="grid grid-cols-1 gap-6  p-4 md:grid-cols-2 md:p-6">
        {/* LEFT SIDE */}
        <IntroSection />

        {/* RIGHT SIDE */}
        <PlayerPanel />
      </div>
    </section>
  );
}
