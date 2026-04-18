import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Upload, BarChart3, Shield,
  Users, BookOpen, Brain, ArrowRight,
  Fingerprint, ChevronRight
} from 'lucide-react'
import { HeroGeometric } from '../components/ui/shape-landing-hero'
import { FloatingHeader } from '../components/ui/floating-header'
import { CinematicFooter } from '../components/ui/motion-footer'

/* ─────────────────────────────────────────────
   ANIMATION VARIANTS
   ───────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }
  })
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } }
}

/* ─────────────────────────────────────────────
   HERO SECTION
   ───────────────────────────────────────────── */
function HeroSection() {
  return (
    <HeroGeometric
      badge="Academic Integrity Suite"
      title1="Detect Academic"
      title2="Anomalies Instantly"
      description="Leverage advanced forensics to identify plagiarism, writing inconsistencies, and multi-author patterns."
    >
      <div className="flex flex-col items-center justify-center gap-6 mt-4 w-full max-w-lg mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            <Link
            to="/upload"
            className="
                w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full
                text-[15px] font-bold text-white no-underline
                shadow-lg shadow-indigo-500/25
                transition-all duration-200
                hover:shadow-indigo-500/40 hover:-translate-y-0.5
                active:scale-[0.98]
            "
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            >
            Get Started
            <Upload className="w-4 h-4" />
            </Link>

            <a
            href="#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full border border-slate-200 bg-white text-[15px] font-bold text-slate-600 hover:bg-slate-50 transition-all no-underline"
            >
            How it Works
            <ChevronRight className="w-4 h-4" />
            </a>
        </div>
      </div>
    </HeroGeometric>
  )
}

/* ─────────────────────────────────────────────
   HOW IT WORKS
   ───────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: 'Analyze Document',
      description: 'Upload your paper in PDF or Word. Analysis begins immediately.',
      step: '01',
    },
    {
      icon: Brain,
      title: 'AI Processing',
      description: 'Our engine identifies linguistic patterns and citation drift.',
      step: '02',
    },
    {
      icon: BarChart3,
      title: 'Full Report',
      description: 'Download a clean, forensic-grade integrity assessment.',
      step: '03',
    },
  ]

  return (
    <section id="how-it-works" className="bg-white border-y border-slate-100 flex flex-col items-center w-full">
      <div className="section-container">
        <motion.div
           className="flex flex-col items-center text-center w-full mb-20"
           variants={fadeUp}
           initial="hidden"
           whileInView="visible"
           viewport={{ once: true }}
        >
          <span className="text-indigo-600 text-sm font-bold tracking-[0.2em] uppercase mb-4 block">Process</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            How Forens<span className="text-indigo-600">IQ</span> Works
          </h2>
          <div className="w-20 h-1 bg-indigo-600 rounded-full mt-6 mb-8" />
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
            A state-of-the-art diagnostic pipeline designed to maintain the highest standards of academic integrity.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-6xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {steps.map(({ icon: Icon, title, description, step }, i) => (
            <motion.div
              key={title}
              variants={fadeUp}
              custom={i}
              className="group flex flex-col items-center text-center p-8 rounded-3xl bg-slate-50 border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
            >
              <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Icon className="w-8 h-8 text-indigo-600" />
              </div>
              <span className="text-xs font-black text-slate-300 tracking-widest uppercase mb-2">
                Step {step}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
              <p className="text-slate-500 leading-relaxed">
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   FEATURES
   ───────────────────────────────────────────── */
function Features() {
  const features = [
      {
        icon: Fingerprint,
        title: 'Stylometrics',
        description: 'Deep linguistic fingerprinting to detect variations in writing style.',
      },
      {
        icon: Shield,
        title: 'Draft Integrity',
        description: 'Tracks revisions and temporal inconsistencies across different drafts.',
      },
      {
        icon: Brain,
        title: 'Contextual AI',
        description: 'Detects semantic shifts that indicate external machine assistance.',
      },
      {
        icon: Users,
        title: 'Team Detection',
        description: 'Identifies if a paper was co-authored by multiple individuals.',
      }
  ]

  return (
    <section id="features" className="bg-slate-50 w-full flex flex-col items-center">
      <div className="section-container">
        <motion.div
           className="flex flex-col items-center text-center w-full mb-20"
           variants={fadeUp}
           initial="hidden"
           whileInView="visible"
           viewport={{ once: true }}
        >
           <span className="text-indigo-600 text-sm font-bold tracking-[0.2em] uppercase mb-4 block">Analysis</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Advanced Capabilities
          </h2>
          <div className="w-20 h-1 bg-indigo-600 rounded-full mt-6 mb-8" />
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-5xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map(({ icon: Icon, title, description }, i) => (
            <motion.div key={title} variants={fadeUp} custom={i}>
              <div className="
                bg-white rounded-[32px] p-10 h-full
                flex flex-col items-center text-center
                border border-slate-200/50 shadow-sm
                transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1
              ">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
                <p className="text-slate-500 leading-relaxed max-w-xs mx-auto">
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   CTA SECTION
   ───────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="bg-white w-full flex flex-col items-center">
      <div className="section-container pb-32">
        <motion.div
          className="flex flex-col items-center text-center p-12 md:p-24 rounded-[48px] bg-slate-900 text-white w-full max-w-6xl mx-auto relative overflow-hidden"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Decorative Background for CTA Card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

          <h2 className="text-3xl md:text-6xl font-black mb-8 leading-tight tracking-tighter">
            Elevate the Standards of <br/> Academic Integrity.
          </h2>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Join hundreds of institutions using ForensIQ to safeguard the quality of education.
          </p>
          <Link
            to="/upload"
            className="
              inline-flex items-center justify-center gap-3 px-12 py-5 rounded-full
              text-[16px] font-black text-white no-underline
              bg-white !text-slate-900
              transition-all duration-300
              hover:scale-105 hover:shadow-2xl hover:shadow-white/20
              active:scale-95
            "
          >
            Start Your First Report
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   HOMEPAGE
   ───────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="relative w-full bg-white font-sans overflow-x-hidden min-h-screen text-slate-900 flex flex-col items-center">
      <FloatingHeader />
      
      <main className="relative z-10 w-full bg-white flex flex-col items-center border-b border-slate-100 shadow-2xl rounded-b-[60px] overflow-hidden">
        <HeroSection />
        <HowItWorks />
        <Features />
        <CTASection />
      </main>

      <div className="bg-white w-full">
         <CinematicFooter />
      </div>
    </div>
  )
}