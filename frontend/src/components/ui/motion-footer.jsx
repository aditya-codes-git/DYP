"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "../../lib/utils";

// Register ScrollTrigger safely for React
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. LIGHT-MODE ADAPTIVE INLINE STYLES
// -------------------------------------------------------------------------
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  
  /* Light Mode Adjusted Variables */
  --pill-bg-1: color-mix(in oklch, var(--foreground) 5%, transparent);
  --pill-bg-2: color-mix(in oklch, var(--foreground) 2%, transparent);
  --pill-shadow: rgba(0, 0, 0, 0.05);
  --pill-highlight: rgba(255, 255, 255, 0.8);
  --pill-inset-shadow: rgba(0, 0, 0, 0.02);
  --pill-border: color-mix(in oklch, var(--foreground) 10%, transparent);
  
  --pill-bg-1-hover: color-mix(in oklch, var(--foreground) 10%, transparent);
  --pill-bg-2-hover: color-mix(in oklch, var(--foreground) 4%, transparent);
  --pill-border-hover: color-mix(in oklch, var(--foreground) 30%, transparent);
  --pill-shadow-hover: rgba(0, 0, 0, 0.1);
  --pill-highlight-hover: rgba(255, 255, 255, 1);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.6; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(239, 68, 68, 0.2)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.4)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 40s linear infinite;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

/* Light-mode Grid Background */
.footer-bg-grid {
  background-size: 60px 60px;
  background-image: 
    linear-gradient(to right, rgba(15, 23, 42, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(15, 23, 42, 0.03) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

/* Light-mode Aurora Glow */
.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    color-mix(in oklch, var(--primary) 10%, transparent) 0%, 
    color-mix(in oklch, var(--secondary) 10%, transparent) 40%, 
    transparent 70%
  );
}

/* Light-mode Glass Pill */
.footer-glass-pill {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.03), 
      inset 0 1px 1px #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: white;
  border-color: rgba(15, 23, 42, 0.15);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  color: #0f172a;
}

/* Giant Background Text Masking (Light Mode) */
.footer-giant-bg-text {
  font-size: 26vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px rgba(15, 23, 42, 0.04);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.06) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Dark text glow for Light Mode */
.footer-text-glow {
  background: linear-gradient(180deg, #0f172a 0%, #334155 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 2px 10px rgba(15, 23, 42, 0.05));
}
`;

const MarqueeItem = () => (
  <div className="flex items-center space-x-12 px-6">
    <span className="text-slate-900">Accountability Redefined</span> <span className="text-indigo-400">✦</span>
    <span className="text-slate-900">Transparent Tracking</span> <span className="text-slate-300">✦</span>
    <span className="text-slate-900">Forensic Insights</span> <span className="text-indigo-400">✦</span>
    <span className="text-slate-900">Academic Integrity</span> <span className="text-slate-300">✦</span>
    <span className="text-slate-900">Absolute Privacy</span> <span className="text-indigo-400">✦</span>
  </div>
);

export function CinematicFooter() {
  const wrapperRef = useRef(null);
  const giantTextRef = useRef(null);
  const headingRef = useRef(null);
  const linksRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        giantTextRef.current,
        { y: "10vh", scale: 0.8, opacity: 0 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 80%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );

      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 40%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );
    }, wrapperRef);

    return () => ctx.revert();
  },[]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      
      <div
        ref={wrapperRef}
        className="relative h-screen w-full flex items-center justify-center"
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <footer className="fixed bottom-0 left-0 flex h-screen w-full flex-col justify-between overflow-hidden bg-white text-slate-900 cinematic-footer-wrapper items-center">
          
          {/* Background elements */}
          <div className="footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
          <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

          {/* Giant background text */}
          <div
            ref={giantTextRef}
            className="footer-giant-bg-text absolute -bottom-[5vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none"
          >
            FORENSIQ
          </div>

          {/* 1. Marquee */}
          <div className="absolute top-12 left-0 w-full overflow-hidden border-y border-slate-100 bg-white/80 backdrop-blur-md py-4 z-10 -rotate-2 scale-110 shadow-sm">
            <div className="flex w-max animate-footer-scroll-marquee text-xs md:text-sm font-bold tracking-[0.3em] uppercase">
              <MarqueeItem />
              <MarqueeItem />
            </div>
          </div>

          {/* 2. Main content centered */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 mt-20 w-full max-w-5xl mx-auto text-center">
            <h2
              ref={headingRef}
              className="text-5xl md:text-8xl font-black footer-text-glow tracking-tighter mb-12 py-4 leading-[1.1]"
            >
              Ready to begin?
            </h2>

            <div ref={linksRef} className="flex flex-col items-center gap-6 w-full">
              <div className="flex flex-wrap justify-center gap-4 w-full">
                <button className="footer-glass-pill px-10 py-5 rounded-full text-slate-900 font-bold text-sm md:text-base flex items-center gap-3 transition-all hover:bg-slate-50">
                  <Upload className="w-5 h-5" />
                  Upload Now
                </button>
                <button className="footer-glass-pill px-10 py-5 rounded-full text-slate-900 font-bold text-sm md:text-base flex items-center gap-3 transition-all hover:bg-slate-50">
                   <Brain className="w-5 h-5" />
                   AI Insights
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-3 md:gap-6 w-full mt-2">
                <a href="#" className="footer-glass-pill px-6 py-3 rounded-full text-slate-500 font-medium text-xs md:text-sm hover:text-slate-900 transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="footer-glass-pill px-6 py-3 rounded-full text-slate-500 font-medium text-xs md:text-sm hover:text-slate-900 transition-colors">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>

          {/* 3. Bottom bar */}
          <div className="relative z-20 w-full pb-8 px-6 md:px-12 flex flex-col md:flex-row items-center gap-6 max-w-7xl mx-auto">
            <div className="flex-1 flex justify-center md:justify-start order-2 md:order-1">
              <div className="text-slate-400 text-[10px] md:text-xs font-semibold tracking-widest uppercase">
                © 2026 ForensIQ. All rights reserved.
              </div>
            </div>

            <div className="flex-1 flex justify-center order-1 md:order-2">
              <div className="footer-glass-pill px-6 py-3 rounded-full flex items-center gap-2 cursor-default border-slate-100">
                <span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Powered by</span>
                <span className="text-slate-900 font-black text-xs md:text-sm tracking-normal">ForensIQ Intelligence</span>
              </div>
            </div>

            <div className="flex-1 flex justify-center md:justify-end order-3">
              <button
                onClick={scrollToTop}
                className="w-12 h-12 rounded-full footer-glass-pill flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// Added Lucide icons for buttons
import { Upload, Brain } from "lucide-react";
