"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type VoiceActivityVisualizerProps = {
  stream: MediaStream | null;
  label?: string;
  fromColor?: string; // CSS color for gradient start (e.g., #34d399)
  toColor?: string; // CSS color for gradient end (e.g., #10b981)
  className?: string;
};

/**
 * VoiceActivityVisualizer
 * - Glassmorphism container with a responsive bar visualizer driven by Web Audio API
 * - Accepts a MediaStream and renders live level-reactive bars
 * - Designed for live call UX (no playback controls)
 */
export default function VoiceActivityVisualizer({
  stream,
  label,
  fromColor,
  toColor,
  className = "",
}: VoiceActivityVisualizerProps) {
  const [level, setLevel] = useState(0); // 0..1
  const [active, setActive] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const srcNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const bufferRef = useRef<Uint8Array | null>(null);

  // Pleasant, symmetric base shape so bars look nice even at low levels
  const NUM_BARS = 28;
  const baseShape = useMemo(() => {
    // Create symmetric distribution with slight randomness
    const half = Math.floor(NUM_BARS / 2);
    const left: number[] = [];
    for (let i = 0; i < half; i++) {
      // center bars taller
      const centerBias = 1 - Math.abs(i - (half - 1)) / half;
      const v = 0.35 + centerBias * 0.55 + Math.random() * 0.1;
      left.push(Math.min(1, Math.max(0.25, v)));
    }
    const right = [...left].reverse();
    const arr = NUM_BARS % 2 === 0 ? [...left, ...right] : [...left, 1, ...right];
    return arr.map((v) => Math.min(1, Math.max(0.2, v)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Clean previous graph
    cleanup();

    if (!stream) {
      setActive(false);
      setLevel(0);
      return;
    }

    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) {
        // No Web Audio API available
        return;
      }
      const audioCtx: AudioContext = new AC();
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024; // good balance for VAD-like responsiveness
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;

      const src = audioCtx.createMediaStreamSource(stream);
      srcNodeRef.current = src;

      src.connect(analyser);

      bufferRef.current = new Uint8Array(analyser.frequencyBinCount);

      let last = 0;
      const update = () => {
        const analyserNode = analyserRef.current;
        if (!analyserNode) return;

        // Time domain gives a nicer amplitude representation for level
        const timeData = new Uint8Array(analyserNode.fftSize);
        analyserNode.getByteTimeDomainData(timeData);

        // Compute normalized RMS from time domain (values are around 128)
        let sum = 0;
        for (let i = 0; i < timeData.length; i++) {
          const v = (timeData[i] - 128) / 128; // -1..1
          sum += v * v;
        }
        const rms = Math.sqrt(sum / timeData.length); // 0..~1
        // Normalize + boost slightly for pleasing visuals
        const instantaneous = Math.min(1, rms * 1.7);

        // Smooth the level
        const smoothed = last * 0.8 + instantaneous * 0.2;
        last = smoothed;
        setLevel(smoothed);
        setActive(smoothed > 0.02);

        rafRef.current = requestAnimationFrame(update);
      };

      rafRef.current = requestAnimationFrame(update);
    } catch {
      // Fail silently if audio graph cannot be built
    }

    return () => {
      cleanup();
    };
  }, [stream]);

  const cleanup = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    try {
      srcNodeRef.current?.disconnect();
    } catch {}
    srcNodeRef.current = null;

    try {
      analyserRef.current?.disconnect();
    } catch {}
    analyserRef.current = null;

    if (audioCtxRef.current) {
      try {
        // Close only if allowed; some browsers throw if already closed
        audioCtxRef.current.close().catch(() => {});
      } catch {}
      audioCtxRef.current = null;
    }
  };

  const gradientFrom = fromColor || "#34d399"; // emerald-400 default (user)
  const gradientTo = toColor || "#10b981"; // emerald-500 default (user)

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl",
        "bg-white/10 dark:bg-white/5",
        "backdrop-blur-xl border border-white/20",
        "shadow-[0_0_1px_0_rgba(255,255,255,0.5),0_8px_30px_rgba(0,0,0,0.25)]",
        "ring-1 ring-white/10",
        "px-4 py-3",
        className,
      ].join(" ")}
    >
      {/* subtle inner light */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl">
        <div className="absolute -inset-16 opacity-[0.08] blur-3xl bg-gradient-to-br from-white to-transparent" />
      </div>

      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-[56px]">
          {label ? (
            <div className="text-[11px] uppercase tracking-wide text-white/80 dark:text-white/70">
              {label}
            </div>
          ) : null}
          <div className="mt-1 h-2 w-2 rounded-full transition-all"
               style={{
                 background: active ? "radial-gradient(circle, #22d3ee 0%, #3b82f6 100%)" : "rgba(255,255,255,0.35)",
                 boxShadow: active ? "0 0 18px rgba(59,130,246,0.8)" : "none",
               }}
          />
        </div>

        <div className="relative flex-1 h-24 flex items-end gap-[4px]">
          {baseShape.map((base, idx) => {
            // scale each bar by level, with base shape emphasis
            const h = 6 + Math.min(1, 0.1 + level * 1.2) * base * 92; // px height
            return (
              <div
                key={idx}
                className="w-[6px] rounded-full"
                style={{
                  height: `${Math.max(6, h)}px`,
                  background: `linear-gradient(180deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
                  boxShadow: active
                    ? `0 4px 12px ${hexToRgba(gradientTo, 0.35)}, 0 0 16px ${hexToRgba(
                        gradientTo,
                        0.25
                      )}`
                    : "none",
                  opacity: 0.9,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Utility: convert hex to rgba
function hexToRgba(hex: string, alpha = 1) {
  const h = hex.replace("#", "");
  const b = parseInt(h.length === 3 ? h[2] + h[2] : h.slice(4, 6), 16);
  const g = parseInt(h.length === 3 ? h[1] + h[1] : h.slice(2, 4), 16);
  const r = parseInt(h.length === 3 ? h[0] + h[0] : h.slice(0, 2), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
