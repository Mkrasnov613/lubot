export default function LiveEventFeedSkeleton() {
  return (
    <div className="rounded-xl p-3 overflow-x-scroll w-full scroll-smooth scrollbar">
      <ul className="flex gap-4 items-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <li
            key={i}
            className="relative rounded-xl bg-gradient-to-b from-bg3 to-bg2 border-1 border-border p-2 flex h-20 gap-5 min-w-100 animate-pulse"
          >
            {/* Profile image skeleton */}
            <div className="w-16 h-16 rounded-full bg-bg3"></div>
            
            {/* User info skeleton */}
            <div className="flex flex-col justify-center gap-2">
              <div className="h-4 w-32 bg-bg3 rounded"></div>
              <div className="h-3 w-20 bg-bg3 rounded"></div>
            </div>
            
            {/* Time skeleton */}
            <div className="absolute top-3 right-5 h-3 w-12 bg-bg3 rounded"></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

