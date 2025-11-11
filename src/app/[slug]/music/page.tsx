import IntroSection from "@/components/MusicPage/IntroSection";
import PlayerPanel from "@/components/MusicPage/PlayerPanel";

export default function MusicPage() {
  return (
    <section className="flex flex-wrap justify-around gap-5 items-center min-h-screen mx-auto max-w-[1680px] p-10 text-[var(--color-text)] bg-bg1">
      
        {/* LEFT SIDE */}
        <div className="w-[700px]">
          {/* RIGHT SIDE */}
          <PlayerPanel />
        </div>
        <div className="">
          <IntroSection />
        </div>
    </section>
  );
}
