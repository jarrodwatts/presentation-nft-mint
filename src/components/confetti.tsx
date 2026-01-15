"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ConfettiProps {
  isActive: boolean;
}

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
}

const COLORS = ["#00FF85", "#ffffff", "#00FF85", "#00CC6A", "#ffffff"];

export function Confetti({ isActive }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1,
      size: 4 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => setParticles([]), 3000);
    return () => clearTimeout(timer);
  }, [isActive]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className={cn("absolute animate-confetti-fall")}
          style={{
            left: `${p.x}%`,
            top: "-20px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
