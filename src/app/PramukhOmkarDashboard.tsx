"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import Image from "next/image";

// Placeholder SVGs (replace with your assets if available)
const KeySVG = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-6 right-8 opacity-5 animate-spin-slow z-10 pointer-events-none">
    <g filter="url(#glow)">
      <path d="M60 20a30 30 0 1 1-21.21 8.79l-8.49-8.49a5 5 0 0 1 7.07-7.07l8.49 8.49A30 30 0 0 1 60 20z" stroke="#a78bfa" strokeWidth="6" fill="none"/>
      <circle cx="60" cy="60" r="10" fill="#a78bfa" fillOpacity="0.7" />
    </g>
    <defs>
      <filter id="glow" x="-20" y="-20" width="160" height="160" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feGaussianBlur stdDeviation="8" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  </svg>
);

const CitySilhouette = () => (
  <svg className="absolute bottom-0 left-0 w-full h-40 opacity-10 blur-sm z-0" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="220" width="1440" height="100" fill="#6366f1" fillOpacity="0.7" />
    <rect x="100" y="180" width="60" height="140" rx="8" fill="#818cf8" />
    <rect x="300" y="200" width="80" height="120" rx="8" fill="#818cf8" />
    <rect x="500" y="160" width="100" height="160" rx="8" fill="#a5b4fc" />
    <rect x="700" y="210" width="60" height="110" rx="8" fill="#818cf8" />
    <rect x="900" y="190" width="90" height="130" rx="8" fill="#818cf8" />
    <rect x="1100" y="170" width="120" height="150" rx="8" fill="#a5b4fc" />
    <rect x="1300" y="200" width="60" height="120" rx="8" fill="#818cf8" />
    <g>
      <rect x="520" y="200" width="10" height="20" fill="#fff" fillOpacity="0.5" />
      <rect x="540" y="220" width="10" height="20" fill="#fff" fillOpacity="0.5" />
      <rect x="1120" y="210" width="10" height="20" fill="#fff" fillOpacity="0.5" />
      <rect x="1140" y="230" width="10" height="20" fill="#fff" fillOpacity="0.5" />
    </g>
  </svg>
);

const cardVariants = {
  rest: { rotateY: 0, scale: 1, boxShadow: "0 4px 24px 0 #312e8133" },
  hover: { rotateY: 8, scale: 1.04, boxShadow: "0 8px 32px 0 #a78bfa55" },
};

export default function PramukhOmkarDashboard() {
  const particlesInit = useCallback(async (engine: any) => {
    await loadFull(engine);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#181a2a] to-[#312e81] overflow-hidden">
      {/* Animated Background */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: { value: "#181a2a" } },
          fpsLimit: 60,
          particles: {
            number: { value: 60, density: { enable: true, area: 800 } },
            color: { value: ["#a78bfa", "#38bdf8", "#818cf8"] },
            shape: { type: "circle" },
            opacity: { value: 0.15 },
            size: { value: { min: 1, max: 3 } },
            move: { enable: true, speed: 0.6, direction: "none", random: true, straight: false, outModes: "out" },
            links: { enable: true, color: "#818cf8", opacity: 0.08, width: 1 },
          },
          detectRetina: true,
        }}
        className="absolute inset-0 w-full h-full z-0"
      />
      {/* Key Watermark */}
      <KeySVG />
      {/* City Silhouette */}
      <CitySilhouette />
      {/* Ambient Glow */}
      <div className="absolute left-1/2 top-32 -translate-x-1/2 w-[60vw] h-[30vw] rounded-full bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-blue-500/10 blur-3xl z-0" />
      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6">
        <span className="text-2xl font-extrabold text-violet-200 tracking-widest drop-shadow">Pramukh Omkar</span>
        <span className="text-sm text-blue-200/80 font-semibold">Real Estate Analytics</span>
      </nav>
      {/* Dashboard Cards */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl mt-8">
          {["Total Sales", "Active Projects", "Highest Lead Score", "Avg. Price per Sqft"].map((title, i) => (
            <motion.div
              key={title}
              className="bg-[#23244a]/80 backdrop-blur rounded-2xl p-8 flex flex-col items-center shadow-xl border border-violet-500/30 hover:border-violet-400/60 transition-all duration-300 group cursor-pointer"
              variants={cardVariants}
              initial="rest"
              whileHover="hover"
              animate="rest"
            >
              <span className="text-lg font-bold text-violet-200 mb-2 drop-shadow">{title}</span>
              <span className="text-3xl font-extrabold text-blue-200 mb-1 drop-shadow-lg">--</span>
              <span className="text-xs text-blue-300/70">Live</span>
            </motion.div>
          ))}
        </div>
        {/* Example Chart Section */}
        <motion.section
          className="w-full max-w-5xl mt-16 bg-[#23244a]/80 rounded-2xl p-8 shadow-2xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-300 group"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-xl font-bold text-blue-200 mb-4">Sales Overview</h2>
          <div className="h-64 flex items-center justify-center text-blue-300/60">[Your Chart Here]</div>
        </motion.section>
      </main>
    </div>
  );
}
