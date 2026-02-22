import { useEffect, useRef } from 'react';

/**
 * Lightweight canvas-based particle network animation.
 * Renders a subtle threat-intel / network visualization aesthetic.
 * Respects prefers-reduced-motion.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

const PARTICLE_COUNT = 60;
const CONNECTION_DISTANCE = 120;
const PARTICLE_SPEED = 0.3;
const ACCENT_COLOR = { r: 0, g: 223, b: 162 }; // #00dfa2

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    // Initialize particles
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w(),
      y: Math.random() * h(),
      vx: (Math.random() - 0.5) * PARTICLE_SPEED,
      vy: (Math.random() - 0.5) * PARTICLE_SPEED,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    canvas.addEventListener('mousemove', handleMouse);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', resize);

    const animate = () => {
      const width = w();
      const height = h();
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Update and draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ACCENT_COLOR.r}, ${ACCENT_COLOR.g}, ${ACCENT_COLOR.b}, ${p.opacity})`;
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${ACCENT_COLOR.r}, ${ACCENT_COLOR.g}, ${ACCENT_COLOR.b}, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Mouse proximity effect
        const mdx = particles[i].x - mouse.x;
        const mdy = particles[i].y - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 150) {
          const opacity = (1 - mDist / 150) * 0.3;
          ctx.beginPath();
          ctx.arc(particles[i].x, particles[i].y, particles[i].size * 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${ACCENT_COLOR.r}, ${ACCENT_COLOR.g}, ${ACCENT_COLOR.b}, ${opacity})`;
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      canvas.removeEventListener('mousemove', handleMouse);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ opacity: 0.6 }}
      aria-hidden="true"
    />
  );
}
