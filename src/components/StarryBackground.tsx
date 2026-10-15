/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  vx: number;
  vy: number;
  hasFlare: boolean;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number; // in radians
  progress: number; // 0 to 1
  opacity: number;
}

interface StarryBackgroundProps {
  enabled?: boolean;
  density?: 'low' | 'normal';
}

export const StarryBackground: React.FC<StarryBackgroundProps> = ({
  enabled = true,
  density = 'normal',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars: Star[] = [];
    let shootingStar: ShootingStar | null = null;
    let nextShootingStarTime = Date.now() + 4000 + Math.random() * 6000;
    let isTabVisible = !document.hidden;

    const initCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Star count based on screen area (ultra lightweight)
      const count = density === 'low'
        ? Math.floor((width * height) / 32000)
        : Math.floor((width * height) / 18000);

      const targetCount = Math.max(35, Math.min(count, 85));

      stars = [];
      for (let i = 0; i < targetCount; i++) {
        const radius = Math.random() < 0.8 ? (0.6 + Math.random() * 0.7) : (1.3 + Math.random() * 0.5);
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius,
          baseAlpha: 0.15 + Math.random() * 0.55,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.012 + Math.random() * 0.025,
          vx: (Math.random() - 0.5) * 0.04,
          vy: 0.06 + Math.random() * 0.14, // Subtle downward float
          hasFlare: radius > 1.4 && Math.random() < 0.25,
        });
      }
    };

    const spawnShootingStar = () => {
      // Spawn from top half or upper right/left
      const startX = Math.random() * (width * 0.85);
      const startY = Math.random() * (height * 0.35);
      const angle = (Math.PI / 180) * (32 + Math.random() * 20); // ~32 to 52 degrees downwards
      const length = 70 + Math.random() * 60;
      const speed = 6 + Math.random() * 3.5;

      shootingStar = {
        x: startX,
        y: startY,
        length,
        speed,
        angle,
        progress: 0,
        opacity: 0.85,
      };
    };

    const render = () => {
      if (!isTabVisible) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const now = Date.now();

      // 1. Draw static or twinkling background stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        if (!prefersReducedMotion) {
          s.twinklePhase += s.twinkleSpeed;
          s.y += s.vy;
          s.x += s.vx;

          // Wrap around seamlessly
          if (s.y > height + 5) {
            s.y = -5;
            s.x = Math.random() * width;
          }
          if (s.x > width + 5) s.x = -5;
          if (s.x < -5) s.x = width + 5;
        }

        // Calculate opacity with smooth cosine twinkle
        const alphaDelta = Math.sin(s.twinklePhase) * 0.28;
        const currentAlpha = Math.max(0.08, Math.min(0.9, s.baseAlpha + alphaDelta));

        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        // Soft micro-glow for rare accent stars
        if (s.hasFlare && currentAlpha > 0.45) {
          ctx.fillStyle = `rgba(255, 255, 255, ${(currentAlpha * 0.18).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Draw rare falling / shooting star
      if (!prefersReducedMotion) {
        if (!shootingStar && now >= nextShootingStarTime) {
          spawnShootingStar();
          // Schedule next shooting star between 10 and 22 seconds
          nextShootingStarTime = now + 10000 + Math.random() * 12000;
        }

        if (shootingStar) {
          const ss = shootingStar;
          ss.progress += 0.018;

          // Movement
          ss.x += Math.cos(ss.angle) * ss.speed;
          ss.y += Math.sin(ss.angle) * ss.speed;

          // Fade out as it nears end of trail
          if (ss.progress > 0.6) {
            ss.opacity = Math.max(0, (1 - ss.progress) * 2.5);
          }

          if (ss.progress >= 1 || ss.opacity <= 0.01 || ss.x > width + 100 || ss.y > height + 100) {
            shootingStar = null;
          } else {
            // Draw gradient trail for the falling star
            const tailX = ss.x - Math.cos(ss.angle) * ss.length;
            const tailY = ss.y - Math.sin(ss.angle) * ss.length;

            const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            grad.addColorStop(0.7, `rgba(255, 255, 255, ${(ss.opacity * 0.35).toFixed(3)})`);
            grad.addColorStop(1, `rgba(255, 255, 255, ${(ss.opacity * 0.95).toFixed(3)})`);

            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(ss.x, ss.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.2;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Head glow
            ctx.fillStyle = `rgba(255, 255, 255, ${(ss.opacity).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(ss.x, ss.y, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (!prefersReducedMotion) {
        animFrameIdRef.current = requestAnimationFrame(render);
      }
    };

    initCanvas();
    render();

    const handleResize = () => {
      initCanvas();
      if (prefersReducedMotion) {
        render();
      }
    };

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [enabled, density]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-90 transition-opacity duration-1000"
    />
  );
};
