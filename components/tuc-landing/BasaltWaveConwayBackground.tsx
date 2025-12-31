'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Cell {
    alive: boolean;
    age: number;
    fixed: boolean;
    distanceFromWave: number;
}

// BasaltCRM colors (Cyan, Teal, Violet, Indigo)
const BASALT_COLORS = [
    { r: 6, g: 182, b: 212 },   // Cyan-500
    { r: 20, g: 184, b: 166 },  // Teal-500
    { r: 139, g: 92, b: 246 },  // Violet-500
    { r: 99, g: 102, b: 241 },  // Indigo-500
    { r: 56, g: 189, b: 248 },  // Sky-400
];

function lerpColor(color1: { r: number, g: number, b: number }, color2: { r: number, g: number, b: number }, t: number) {
    return {
        r: Math.round(color1.r + (color2.r - color1.r) * t),
        g: Math.round(color1.g + (color2.g - color1.g) * t),
        b: Math.round(color1.b + (color2.b - color1.b) * t),
    };
}

function getColorForDistance(distance: number): { r: number, g: number, b: number } {
    // Normalize distance to color index
    const maxDistance = 30; // cells
    const normalizedDist = Math.min(distance / maxDistance, 1);
    const colorIndex = normalizedDist * (BASALT_COLORS.length - 1);
    const lowerIndex = Math.floor(colorIndex);
    const upperIndex = Math.min(lowerIndex + 1, BASALT_COLORS.length - 1);
    const t = colorIndex - lowerIndex;

    return lerpColor(BASALT_COLORS[lowerIndex], BASALT_COLORS[upperIndex], t);
}

export default function BasaltWaveConwayBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const gridRef = useRef<Cell[][]>([]);
    const timeRef = useRef<number>(0);
    const waveRowRef = useRef<number[]>([]);

    const CELL_SIZE = 12;
    const DOT_RADIUS = 2;
    const WAVE_SPEED = 0.02;
    const CONWAY_INTERVAL = 150;
    const lastConwayUpdate = useRef<number>(0);

    const initGrid = useCallback((cols: number, rows: number) => {
        const grid: Cell[][] = [];
        for (let y = 0; y < rows; y++) {
            grid[y] = [];
            for (let x = 0; x < cols; x++) {
                grid[y][x] = { alive: false, age: 0, fixed: false, distanceFromWave: 0 };
            }
        }
        return grid;
    }, []);

    const countNeighbors = useCallback((grid: Cell[][], x: number, y: number, cols: number, rows: number): number => {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = (x + dx + cols) % cols;
                const ny = (y + dy + rows) % rows;
                if (grid[ny][nx].alive) count++;
            }
        }
        return count;
    }, []);

    const updateConway = useCallback((grid: Cell[][], cols: number, rows: number): Cell[][] => {
        const newGrid: Cell[][] = [];
        for (let y = 0; y < rows; y++) {
            newGrid[y] = [];
            for (let x = 0; x < cols; x++) {
                const cell = grid[y][x];
                const neighbors = countNeighbors(grid, x, y, cols, rows);

                // Calculate distance from wave at this x position
                const waveRow = waveRowRef.current[x] || rows / 2;
                const distFromWave = Math.abs(y - waveRow);

                if (cell.fixed) {
                    newGrid[y][x] = { ...cell, distanceFromWave: 0 };
                } else if (cell.alive) {
                    if (neighbors === 2 || neighbors === 3) {
                        newGrid[y][x] = {
                            alive: true,
                            age: Math.min(cell.age + 1, 50),
                            fixed: false,
                            distanceFromWave: Math.max(cell.distanceFromWave, distFromWave)
                        };
                    } else {
                        newGrid[y][x] = { alive: false, age: 0, fixed: false, distanceFromWave: 0 };
                    }
                } else {
                    if (neighbors === 3) {
                        // New cells inherit average distance from neighbors
                        let totalDist = 0;
                        let aliveNeighbors = 0;
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                const nx = (x + dx + cols) % cols;
                                const ny = (y + dy + rows) % rows;
                                if (grid[ny][nx].alive) {
                                    totalDist += grid[ny][nx].distanceFromWave;
                                    aliveNeighbors++;
                                }
                            }
                        }
                        const avgDist = aliveNeighbors > 0 ? totalDist / aliveNeighbors : distFromWave;
                        newGrid[y][x] = {
                            alive: true,
                            age: 1,
                            fixed: false,
                            distanceFromWave: Math.max(avgDist, distFromWave)
                        };
                    } else {
                        newGrid[y][x] = { alive: false, age: 0, fixed: false, distanceFromWave: 0 };
                    }
                }
            }
        }
        return newGrid;
    }, [countNeighbors]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const cols = Math.ceil(canvas.width / CELL_SIZE);
            const rows = Math.ceil(canvas.height / CELL_SIZE);
            gridRef.current = initGrid(cols, rows);
            waveRowRef.current = new Array(cols).fill(rows / 2);
        };

        resize();
        window.addEventListener('resize', resize);

        const animate = (timestamp: number) => {
            if (!ctx || !canvas) return;

            const cols = Math.ceil(canvas.width / CELL_SIZE);
            const rows = Math.ceil(canvas.height / CELL_SIZE);

            ctx.fillStyle = 'rgba(2, 6, 23, 0.2)'; // Slate-950 with opacity for trail
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            timeRef.current += WAVE_SPEED;

            const waveY = canvas.height * 0.6;
            const waveAmplitude = 60;
            const waveFrequency = 0.015;

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    if (gridRef.current[y]?.[x]) {
                        gridRef.current[y][x].fixed = false;
                    }
                }
            }

            for (let x = 0; x < cols; x++) {
                const pixelX = x * CELL_SIZE + CELL_SIZE / 2;

                const wave1 = Math.sin(pixelX * waveFrequency + timeRef.current) * waveAmplitude;
                const wave2 = Math.sin(pixelX * waveFrequency * 0.5 + timeRef.current * 1.3) * (waveAmplitude * 0.5);
                const wave3 = Math.sin(pixelX * waveFrequency * 2 + timeRef.current * 0.7) * (waveAmplitude * 0.2);

                const rawWave = wave1 + wave2 + wave3;
                const breakingFactor = Math.max(0, Math.sin(timeRef.current * 0.5 + pixelX * 0.002));
                const currentWaveY = waveY + rawWave - (breakingFactor * 30);

                const waveRow = Math.floor(currentWaveY / CELL_SIZE);
                waveRowRef.current[x] = waveRow;

                for (let offset = -3; offset <= 2; offset++) {
                    const y = waveRow + offset;
                    if (y >= 0 && y < rows && gridRef.current[y]?.[x]) {
                        const intensity = 1 - Math.abs(offset) / 3;
                        if (Math.random() < intensity * 0.4) {
                            gridRef.current[y][x].alive = true;
                            gridRef.current[y][x].fixed = offset <= 0;
                            gridRef.current[y][x].age = offset <= 0 ? 0 : 1;
                            gridRef.current[y][x].distanceFromWave = Math.abs(offset);
                        }
                    }
                }
            }

            if (timestamp - lastConwayUpdate.current > CONWAY_INTERVAL) {
                gridRef.current = updateConway(gridRef.current, cols, rows);
                lastConwayUpdate.current = timestamp;
            }

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const cell = gridRef.current[y]?.[x];
                    if (!cell?.alive) continue;

                    const pixelX = x * CELL_SIZE + CELL_SIZE / 2;
                    const pixelY = y * CELL_SIZE + CELL_SIZE / 2;

                    ctx.beginPath();
                    ctx.arc(pixelX, pixelY, DOT_RADIUS, 0, Math.PI * 2);

                    if (cell.fixed) {
                        // Wave cells - cyan/blue
                        const gradient = ctx.createRadialGradient(pixelX, pixelY, 0, pixelX, pixelY, DOT_RADIUS * 3);
                        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.9)'); // Cyan-500
                        gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.5)');
                        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
                        ctx.fillStyle = gradient;
                        ctx.fill();

                        ctx.beginPath();
                        ctx.arc(pixelX, pixelY, DOT_RADIUS * 0.8, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(165, 243, 252, 0.9)'; // Cyan-200
                        ctx.fill();
                    } else {
                        // Conway cells - color based on distance
                        const color = getColorForDistance(cell.distanceFromWave);
                        const alpha = Math.min(0.8, 0.3 + (cell.age / 50) * 0.5);

                        const gradient = ctx.createRadialGradient(pixelX, pixelY, 0, pixelX, pixelY, DOT_RADIUS * 2);
                        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
                        gradient.addColorStop(0.6, `rgba(${Math.floor(color.r * 0.8)}, ${Math.floor(color.g * 0.8)}, ${Math.floor(color.b * 0.8)}, ${alpha * 0.6})`);
                        gradient.addColorStop(1, `rgba(${Math.floor(color.r * 0.6)}, ${Math.floor(color.g * 0.6)}, ${Math.floor(color.b * 0.6)}, 0)`);
                        ctx.fillStyle = gradient;
                        ctx.fill();
                    }
                }
            }

            // Draw wave line
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)'; // Cyan with low opacity
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = 0; x < canvas.width; x += 2) {
                const wave1 = Math.sin(x * waveFrequency + timeRef.current) * waveAmplitude;
                const wave2 = Math.sin(x * waveFrequency * 0.5 + timeRef.current * 1.3) * (waveAmplitude * 0.5);
                const y = waveY + wave1 + wave2;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationRef.current);
        };
    }, [initGrid, updateConway]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{ opacity: 0.6 }}
        />
    );
}
