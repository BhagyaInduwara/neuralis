export default function StaticFallback() {
  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden bg-[#050506]"
      aria-hidden="true"
    >
      <div className="absolute right-[8%] top-1/2 h-[46vh] w-[46vh] -translate-y-1/2 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1a1b1e] to-[#0a0a0c] shadow-[0_0_140px_40px_rgba(255,138,61,0.15)]">
        <div className="absolute inset-6 rounded-2xl border border-[#ff8a3d]/25" />
        <div className="absolute inset-10 rounded-xl bg-black/60" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_50%,rgba(255,138,61,0.08),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.5))]" />
    </div>
  );
}
