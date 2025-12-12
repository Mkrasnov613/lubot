import SideNav from "@/components/Header";
import ActivityFeedComponent from "@/components/ActivityFeedComponent";
import NavBar from "@/components/NavBar";
import PlayerPanel from "@/components/MusicPlayer/PlayerPanel";
export default function Layout({ children }: LayoutProps<"/[slug]">) {
  return (
    <main className="flex flex-col justify-between items-center w-screen lg:h-screen overflow-hidden">
      <SideNav />
      <div className="max-w-[1820px] mx-auto gap-5 px-8 py-4 flex justify-center items-start">
        <div className="flex-1 min-w-[1285px]">{children}</div>

        <div className="flex flex-col justify-between items-center min-h-[635px]">
          <ActivityFeedComponent />
          <NavBar />
        </div>
      </div>
      <div className="w-[1740px]">
        <PlayerPanel />
      </div>
    </main>
  );
}
