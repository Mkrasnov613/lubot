export default function TwitchChannelComponentSkeleton() {
  return (
    <article className="flex flex-col gap-5 min-h-[400px] w-[760px] p-5 shadow-large bg-gradient-to-b from-bg3 to-5% to-bg2 border-1 border-border border-t-highlight rounded-2xl self-end animate-pulse">
      {/* TwitchPlayer skeleton */}
      <div className="flex items-center">
        <div className="w-full h-[480px] bg-bg3 rounded-lg"></div>
      </div>
      
      {/* Channel info skeleton */}
      <div className="flex gap-5 font-semibold justify-start items-center text-text">
        {/* Box art skeleton */}
        <div className="w-[70px] h-[93px] rounded bg-bg3"></div>

        {/* Channel name and meta skeleton */}
        <div className="flex flex-col gap-2">
          <div className="h-7 w-48 bg-bg3 rounded"></div>
          <div className="h-5 w-64 bg-bg3 rounded"></div>
          <div className="h-5 w-52 bg-bg3 rounded mt-1"></div>
        </div>
      </div>
    </article>
  );
}

