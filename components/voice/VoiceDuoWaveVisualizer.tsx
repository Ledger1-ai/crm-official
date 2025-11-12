"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type VoiceDuoWaveVisualizerProps = {
  leftStream: MediaStream | null; // User
  rightStream: MediaStream | null; // Agent
  leftLabel?: string;
  rightLabel?: string;
  className?: string;
  leftColors?: [string, string]; // gradient [start, end]
  rightColors?: [string, string]; // gradient [start, end]
};

/**
 * VoiceDuoWaveVisualizer
 * Unified, mesmerizing glassmorphic wave visualizer that blends left (user) and right (agent) activity
 * into a continuous animated waveform. The amplitude is spatially mixed so peaks on the left respond to user
 * voice and peaks on the right respond to agent voice. Includes moving glass shine that shifts direction
 * based on activity dominance.
 *
 * Designed to be purely visual and non-intrusive (no playback or graph feedback to RTCPeerConnection).
 */
export default function VoiceDuoWaveVisualizer({
  leftStream,
  rightStream,
  leftLabel = "User",
  rightLabel = "Agent",
  className = "",
  leftColors = ["#22d3ee", "#3b82f6"], // cyan -> blue
  rightColors = ["#8b5cf6", "#60a5fa"], // violet -> azure
}: VoiceDuoWaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio analysis refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const leftAnalyserRef = useRef<AnalyserNode | null>(null);
  const rightAnalyserRef = useRef<AnalyserNode | null>(null);
  const leftSrcRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rightSrcRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Levels and activity (refs for high-frequency update without React re-renders)
  const leftLevelRef = useRef(0); // 0..1
  const rightLevelRef = useRef(0); // 0..1
  const leftActiveRef = useRef(false);
  const rightActiveRef = useRef(false);

  // Phase and shine motion
  const phaseRef = useRef(0);
  const shineTRef = useRef(0.5); // 0..1 position of moving shine
  const shineDirRef = useRef(1); // +1 to right, -1 to left

  // Base shape randomness for organic motion
  const noiseSeed = useMemo(() => Math.random() * 1000, []);
  const noise = (x: number) => {
    // lightweight pseudo-noise
    return Math.sin(x * 1.3 + noiseSeed) * 0.5 + Math.sin(x * 0.73 + noiseSeed * 1.7) * 0.5;
  };

  // Initialize / update audio graph when streams change
  useEffect(() => {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) {
      // silently skip if Web Audio not available
      return;
    }

    // Ensure single AudioContext
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AC();
    }
    if (!audioCtxRef.current) return;
    const audioCtx = audioCtxRef.current as AudioContext;

    // Ensure the AudioContext is running (resume if suspended) after user gesture
    const resumeIfNeeded = async () => {
      if (audioCtx.state === "suspended") {
        try {
          await audioCtx.resume();
        } catch {}
      }
    };
    // Attempt immediate resume and on first pointer interaction
    resumeIfNeeded();
    const onUserGesture = () => resumeIfNeeded();
    window.addEventListener("pointerdown", onUserGesture, { once: true });

    // Helper to attach stream -> analyser
    const attach = (
      stream: MediaStream | null,
      srcRef: React.MutableRefObject<MediaStreamAudioSourceNode | null>,
      analyserRef: React.MutableRefObject<AnalyserNode | null>
    ) => {
      // Cleanup existing
      try {
        srcRef.current?.disconnect();
      } catch {}
      srcRef.current = null;
      try {
        analyserRef.current?.disconnect();
      } catch {}
      analyserRef.current = null;

      if (!stream) return;

      try {
        const src = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.85;
        src.connect(analyser);
        srcRef.current = src;
        analyserRef.current = analyser;
      } catch {
        // ignore
      }
    };

    attach(leftStream, leftSrcRef, leftAnalyserRef);
    attach(rightStream, rightSrcRef, rightAnalyserRef);

    // Start / restart animation
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const tick = () => {
      updateLevels();
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      try {
        leftSrcRef.current?.disconnect();
      } catch {}
      try {
        rightSrcRef.current?.disconnect();
      } catch {}
      leftSrcRef.current = null;
      rightSrcRef.current = null;
      try {
        leftAnalyserRef.current?.disconnect();
      } catch {}
      try {
        rightAnalyserRef.current?.disconnect();
      } catch {}
      leftAnalyserRef.current = null;
      rightAnalyserRef.current = null;

      // Leave audioCtx alive for subsequent stream changes; don't close here to avoid user gesture issues.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftStream, rightStream]);

  const updateLevels = () => {
    const leftAnalyser = leftAnalyserRef.current;
    const rightAnalyser = rightAnalyserRef.current;

    const computeRms = (analyser: AnalyserNode | null) => {
      if (!analyser) return 0;
      const timeData = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(timeData);
      let sum = 0;
      for (let i = 0; i < timeData.length; i++) {
        const v = (timeData[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / timeData.length);
      // pleasing boost + clamp
      return Math.min(1, rms * 1.9);
    };

    // Smooth updates
    const lPrev = leftLevelRef.current;
    const rPrev = rightLevelRef.current;
    const lInst = computeRms(leftAnalyser);
    const rInst = computeRms(rightAnalyser);
    const lSmooth = lPrev * 0.8 + lInst * 0.2;
    const rSmooth = rPrev * 0.8 + rInst * 0.2;

    leftLevelRef.current = lSmooth;
    rightLevelRef.current = rSmooth;

    leftActiveRef.current = lSmooth > 0.015;
    rightActiveRef.current = rSmooth > 0.015;

    // Phase advances proportional to overall energy
    const energy = Math.max(0.15, (lSmooth + rSmooth) * 0.5);
    phaseRef.current += 0.02 + energy * 0.03;

    // Shine direction follows dominance
    shineDirRef.current = lSmooth > rSmooth ? 1 : -1;
    shineTRef.current = clamp(shineTRef.current + shineDirRef.current * (0.004 + energy * 0.006), 0.0, 1.0);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (canvas.width !== Math.floor(W * dpr) || canvas.height !== Math.floor(H * dpr)) {
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Glass backdrop shimmer (subtle)
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "rgba(255,255,255,0.09)");
    bgGrad.addColorStop(1, "rgba(255,255,255,0.02)");
    ctx.fillStyle = bgGrad;
    roundRect(ctx, 0, 0, W, H, 18);
    ctx.fill();

    // Wave gradient across (blend left/right palettes)
    const waveGrad = ctx.createLinearGradient(0, 0, W, 0);
    waveGrad.addColorStop(0.0, leftColors[0]);
    waveGrad.addColorStop(0.18, leftColors[1]);
    waveGrad.addColorStop(0.5, mixHex(leftColors[1], rightColors[0], 0.5));
    waveGrad.addColorStop(0.82, rightColors[0]);
    waveGrad.addColorStop(1.0, rightColors[1]);

    // Compute spatial amplitude mixing
    const baseY = H * 0.5;
    const leftLevel = leftLevelRef.current;
    const rightLevel = rightLevelRef.current;
    const phase = phaseRef.current;

    // Main unified wave
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    const freq = 0.018; // horizontal frequency
    const thickness = 2.2;
    for (let x = 0; x <= W; x += 2) {
      const t = x / W; // 0..1
      // spatial bias curve (emphasize edges)
      const lBias = Math.pow(1 - t, 1.6);
      const rBias = Math.pow(t, 1.6);
      const amp = (leftLevel * lBias + rightLevel * rBias) * (H * 0.22);

      // organic variability
      const organic = noise(x * 0.006 + phase * 0.7) * amp * 0.35;

      const y =
        baseY +
        Math.sin(x * freq + phase * 1.15) * amp * 0.75 +
        Math.sin(x * freq * 1.9 + phase * 0.8) * amp * 0.25 +
        organic;

      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = waveGrad;
    ctx.lineWidth = thickness;
    ctx.shadowColor = hexToRgba(leftColors[1], leftActiveRef.current ? 0.28 : 0.12);
    ctx.shadowBlur = 12;
    ctx.stroke();

    // Fill under wave for glass tint
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, 0, 0, H);
    fillGrad.addColorStop(0, "rgba(255,255,255,0.08)");
    fillGrad.addColorStop(1, "rgba(255,255,255,0.02)");
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Two subtle overlay strokes left/right to hint duality
    // Left overlay
    ctx.beginPath();
    for (let x = 0; x <= W * 0.5; x += 2) {
      const t = x / (W * 0.5);
      const amp = leftLevel * Math.pow(1 - t, 1.3) * (H * 0.15);
      const y = baseY + Math.sin(x * freq * 1.6 + phase * 1.4) * amp;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = hexToRgba(leftColors[1], leftActiveRef.current ? 0.85 : 0.35);
    ctx.lineWidth = 1.2;
    ctx.shadowColor = hexToRgba(leftColors[1], leftActiveRef.current ? 0.35 : 0.15);
    ctx.shadowBlur = leftActiveRef.current ? 10 : 6;
    ctx.stroke();

    // Right overlay
    ctx.beginPath();
    for (let x = W; x >= W * 0.5; x -= 2) {
      const t = (W - x) / (W * 0.5);
      const amp = rightLevel * Math.pow(1 - t, 1.3) * (H * 0.15);
      const y = baseY + Math.sin(x * freq * 1.6 + phase * 1.1) * amp;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = hexToRgba(rightColors[0], rightActiveRef.current ? 0.85 : 0.35);
    ctx.lineWidth = 1.2;
    ctx.shadowColor = hexToRgba(rightColors[0], rightActiveRef.current ? 0.35 : 0.15);
    ctx.shadowBlur = rightActiveRef.current ? 10 : 6;
    ctx.stroke();

    // Moving shine that shifts left/right dominance
    const shineT = shineTRef.current;
    const shineX = shineT * W;
    const shineGrad = ctx.createRadialGradient(shineX, baseY, 0, shineX, baseY, W * 0.65);
    const activeColor = leftActiveRef.current ? leftColors[1] : rightColors[0];
    shineGrad.addColorStop(0, hexToRgba(activeColor, 0.15));
    shineGrad.addColorStop(1, "rgba(255,255,255,0.00)");
    ctx.fillStyle = shineGrad;
    ctx.globalCompositeOperation = "lighter";
    roundRect(ctx, 0, 0, W, H, 18);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Edge highlights
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    roundRect(ctx, 0.5, 0.5, W - 1, H - 1, 18);
    ctx.stroke();
  };

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl",
        "bg-white/10 dark:bg-white/5",
        "backdrop-blur-xl border border-white/20",
        "shadow-[0_0_1px_0_rgba(255,255,255,0.5),0_12px_40px_rgba(0,0,0,0.35)]",
        "ring-1 ring-white/10",
        "px-4 py-3",
        className,
      ].join(" ")}
    >
      {/* Ambient inner glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl">
        <div className="absolute -inset-24 opacity-[0.08] blur-3xl bg-gradient-to-br from-white to-transparent" />
      </div>

      <div className="relative flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full transition-all"
            style={{
              background: leftActiveRef.current
                ? "radial-gradient(circle, #22d3ee 0%, #3b82f6 100%)"
                : "rgba(255,255,255,0.35)",
              boxShadow: leftActiveRef.current ? "0 0 18px rgba(59,130,246,0.8)" : "none",
            }}
          />
          <div className="text-[11px] uppercase tracking-wide text-white/80 dark:text-white/70">{leftLabel}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[11px] uppercase tracking-wide text-white/80 dark:text-white/70">{rightLabel}</div>
          <div
            className="h-2 w-2 rounded-full transition-all"
            style={{
              background: rightActiveRef.current
                ? "radial-gradient(circle, #8b5cf6 0%, #60a5fa 100%)"
                : "rgba(255,255,255,0.35)",
              boxShadow: rightActiveRef.current ? "0 0 18px rgba(96,165,250,0.8)" : "none",
            }}
          />
        </div>
      </div>

      <div className="relative">
        <canvas ref={canvasRef} className="w-full h-[160px]" />
      </div>
    </div>
  );
}

// Helpers

function hexToRgba(hex: string, alpha = 1) {
  const h = hex.replace("#", "");
  const b = parseInt(h.length === 3 ? h[2] + h[2] : h.slice(4, 6), 16);
  const g = parseInt(h.length === 3 ? h[1] + h[1] : h.slice(2, 4), 16);
  const r = parseInt(h.length === 3 ? h[0] + h[0] : h.slice(0, 2), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function mixHex(h1: string, h2: string, t: number) {
  const c1 = hexToRgb(h1);
  const c2 = hexToRgb(h2);
  const r = Math.round(c1.r * (1 - t) + c2.r * t);
  const g = Math.round(c1.g * (1 - t) + c2.g * t);
  const b = Math.round(c1.b * (1 - t) + c2.b * t);
  return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.length === 3 ? h[0] + h[0] : h.slice(0, 2), 16);
  const g = parseInt(h.length === 3 ? h[1] + h[1] : h.slice(2, 4), 16);
  const b = parseInt(h.length === 3 ? h[2] + h[2] : h.slice(4, 6), 16);
  return { r, g, b };
}

// Draw rounded rect path
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
