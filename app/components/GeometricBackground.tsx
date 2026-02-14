"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

export default function GeometricBackground() {
    const [slide, setSlide] = useState(0);
    const [particles, setParticles] = useState<{ top: string; left: string; duration: number; delay: number; size: number }[]>([]);
    const [streamLines, setStreamLines] = useState<{ top: string; left: string; width: string; duration: number; delay: number }[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // Generate random values on client-side to avoid hydration mismatch
        setParticles(
            [...Array(30)].map(() => ({
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                duration: 3 + Math.random() * 4,
                delay: Math.random() * 2,
                size: Math.random() * 4 + 1,
            }))
        );

        setStreamLines(
            [...Array(15)].map(() => ({
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 200 + 50}px`,
                duration: 1 + Math.random() * 2,
                delay: Math.random() * 2,
            }))
        );

        const interval = setInterval(() => {
            setSlide((prev) => (prev + 1) % 3);
        }, 8000);

        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setMousePosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                });
            }
        };

        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            clearInterval(interval);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none bg-black">
            {/* Dynamic Mesh Gradient Background - More Vibrant */}
            <motion.div
                className="absolute inset-0 opacity-50"
                animate={{
                    background: [
                        "radial-gradient(circle at 50% 50%, #06b6d4 0%, transparent 50%), radial-gradient(circle at 0% 0%, #0f766e 0%, transparent 50%)",
                        "radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%), radial-gradient(circle at 20% 80%, #ec4899 0%, transparent 50%)", // Added Pink/Purple
                        "radial-gradient(circle at 20% 20%, #10b981 0%, transparent 50%), radial-gradient(circle at 80% 80%, #3b82f6 0%, transparent 50%)", // Added Emerald
                    ],
                }}
                transition={{ duration: 12, repeat: Infinity, repeatType: "reverse" }}
            />

            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />

            <AnimatePresence mode="wait">
                {slide === 0 && (
                    <motion.div
                        key="slide1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0"
                    >
                        {/* Slide 1: Neural Constellation - Interactive */}
                        {particles.map((p, i) => (
                            <motion.div
                                key={i}
                                className="absolute rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                                style={{
                                    top: p.top,
                                    left: p.left,
                                    width: p.size,
                                    height: p.size,
                                }}
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.4, 1, 0.4],
                                    x: (mousePosition.x - (window.innerWidth / 2)) * 0.02 * (i % 5 + 1), // Parallax effect
                                    y: (mousePosition.y - (window.innerHeight / 2)) * 0.02 * (i % 5 + 1),
                                }}
                                transition={{
                                    scale: { duration: p.duration, repeat: Infinity },
                                    opacity: { duration: p.duration, repeat: Infinity },
                                    x: { type: "spring", stiffness: 50, damping: 20 },
                                    y: { type: "spring", stiffness: 50, damping: 20 },
                                }}
                            />
                        ))}
                        <svg className="absolute inset-0 w-full h-full opacity-30">
                            <motion.path
                                d="M100,100 Q400,50 700,100 T1200,100"
                                fill="none"
                                stroke="url(#grad1)"
                                strokeWidth="2"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 4, ease: "easeInOut" }}
                            />
                            <defs>
                                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" style={{ stopColor: "#22d3ee", stopOpacity: 0 }} />
                                    <stop offset="50%" style={{ stopColor: "#22d3ee", stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: "#22d3ee", stopOpacity: 0 }} />
                                </linearGradient>
                            </defs>
                        </svg>
                    </motion.div>
                )}

                {slide === 1 && (
                    <motion.div
                        key="slide2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0"
                    >
                        {/* Slide 2: Data Stream - High Velocity */}
                        {streamLines.map((line, i) => (
                            <motion.div
                                key={i}
                                className="absolute h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"
                                style={{
                                    top: line.top,
                                    left: line.left,
                                    width: line.width,
                                }}
                                animate={{
                                    x: [0, 1000], // Move right
                                    opacity: [0, 1, 0],
                                }}
                                transition={{
                                    duration: line.duration,
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: line.delay,
                                }}
                            />
                        ))}
                        <motion.div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-purple-500/30 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                            <div className="absolute top-0 left-1/2 w-4 h-4 bg-purple-500 rounded-full blur-md" />
                        </motion.div>
                    </motion.div>
                )}

                {slide === 2 && (
                    <motion.div
                        key="slide3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0"
                    >
                        {/* Slide 3: Global Intelligence - Rotating Globe/Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

                        <motion.div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border-2 border-emerald-500/20 rounded-full"
                            style={{ perspective: 1000 }}
                        >
                            <motion.div
                                className="w-full h-full rounded-full border border-emerald-500/30"
                                animate={{ rotateX: 360, rotateY: 360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            />
                        </motion.div>

                        <motion.div
                            className="absolute top-1/3 left-1/3 w-20 h-20 bg-emerald-500/20 backdrop-blur-md rounded-lg border border-emerald-500/40"
                            animate={{
                                rotate: [0, 90, 180, 270, 360],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Persistent Grid Overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" style={{ opacity: 0.15 }} />
        </div>
    );
}
