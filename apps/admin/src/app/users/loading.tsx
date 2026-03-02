export default function UsersLoading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-20 bg-white/5 rounded animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 bg-white/[0.02] rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
