export default function SkeletonLoader({ 
  type = "card", 
  count = 1 
}: { 
  type?: "card" | "list" | "avatar" | "text" | "button";
  count?: number;
}) {
  const renderSkeleton = () => {
    switch (type) {
      case "card":
        return (
          <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 p-6 shadow-clay-surface border border-slate-300 animate-pulse">
            <div className="h-4 bg-slate-300 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-slate-300 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-slate-300 rounded w-full mb-2"></div>
            <div className="h-3 bg-slate-300 rounded w-2/3"></div>
          </div>
        );
      case "list":
        return (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-100 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-slate-300"></div>
            <div className="flex-1">
              <div className="h-4 bg-slate-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-300 rounded w-1/2"></div>
            </div>
          </div>
        );
      case "avatar":
        return (
          <div className="w-12 h-12 rounded-full bg-slate-300 animate-pulse"></div>
        );
      case "text":
        return (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-slate-300 rounded w-full"></div>
            <div className="h-4 bg-slate-300 rounded w-5/6"></div>
            <div className="h-4 bg-slate-300 rounded w-4/6"></div>
          </div>
        );
      case "button":
        return (
          <div className="h-10 px-6 rounded-full bg-slate-300 animate-pulse"></div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </div>
  );
}
