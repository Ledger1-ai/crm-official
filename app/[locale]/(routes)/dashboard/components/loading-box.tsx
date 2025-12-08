const LoadingBox = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6">
      {/* Title skeleton */}
      <div className="h-4 w-40 rounded bg-white/10 animate-pulse mb-4" />

      {/* Main block skeleton */}
      <div className="h-10 w-full rounded bg-white/10 animate-pulse mb-4" />

      {/* Grid skeletons */}
      <div className="grid grid-cols-3 gap-3">
        <div className="h-20 rounded bg-white/10 animate-pulse" />
        <div className="h-20 rounded bg-white/10 animate-pulse" />
        <div className="h-20 rounded bg-white/10 animate-pulse" />
      </div>

      {/* Sub text skeleton */}
      <div className="mt-4 h-3 w-2/3 rounded bg-white/10 animate-pulse" />
    </div>
  );
};

export default LoadingBox;
