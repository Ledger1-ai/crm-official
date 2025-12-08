"use client";

import Image from "next/image";

const PARTICLES = Array.from({ length: 36 }).map((_, i) => ({
  left: `${(i * 27) % 100}%`,
  size: 2 + ((i * 7) % 4),
  delay: `-${(i % 12) * 0.25}s`,
  duration: `${6 + ((i * 3) % 7)}s`,
  blur: ((i * 5) % 2) === 0 ? 0 : 1,
}));

const LoadingComponent = () => {
  return (
    <div className="relative w-full h-full min-h-[260px] flex items-center justify-center overflow-hidden">
      {/* Ambient gradient backdrop */}
      <div className="absolute inset-0 opacity-70">
        <div className="absolute -inset-32 bg-[radial-gradient(60%_60%_at_30%_20%,rgba(34,211,238,0.18),transparent_60%),radial-gradient(50%_50%_at_80%_70%,rgba(139,92,246,0.16),transparent_60%)]" />
      </div>

      {/* Shimmer sweep */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -inset-x-1 inset-y-0 translate-x-[-150%] bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 animate-[shine_2.2s_linear_infinite]" />
      </div>

      {/* Particles field */}
      <div className="absolute inset-0">
        {PARTICLES.map((p, idx) => (
          <span
            key={idx}
            className={`absolute bottom-[-10%] rounded-full bg-cyan-300/40 ${p.blur ? "blur-[1px]" : ""}`}
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animation: `rise ${p.duration} linear infinite`,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>

      {/* Spinning glow rings */}
      <div className="absolute w-52 h-52 rounded-full border border-cyan-400/20" />
      <div className="absolute w-52 h-52 rounded-full border border-violet-400/20 animate-[spinSlow_12s_linear_infinite]" />

      {/* Center logo with filter and motion */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <Image
          src="/crmlogo.png"
          alt="CRM Loading"
          width={84}
          height={84}
          priority
          className="select-none will-change-transform will-change-filter animate-[float_3s_ease-in-out_infinite,hue_6s_linear_infinite] [filter:drop-shadow(0_0_14px_rgba(34,211,238,0.60))]"
        />
        <div className="text-xs tracking-widest uppercase text-white/60">Loading CRM…</div>
      </div>

      <style jsx>{`
        @keyframes hue {
          0% { filter: hue-rotate(0deg) drop-shadow(0 0 14px rgba(34,211,238,0.60)); }
          50% { filter: hue-rotate(180deg) drop-shadow(0 0 18px rgba(139,92,246,0.55)); }
          100% { filter: hue-rotate(360deg) drop-shadow(0 0 14px rgba(34,211,238,0.60)); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.03); }
        }
        @keyframes shine {
          0% { transform: translateX(-150%) skewX(12deg); }
          100% { transform: translateX(150%) skewX(12deg); }
        }
        @keyframes spinSlow { to { transform: rotate(360deg); } }
        @keyframes rise {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(-60vh) translateX(6px); }
          100% { transform: translateY(-120vh) translateX(-6px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LoadingComponent;
