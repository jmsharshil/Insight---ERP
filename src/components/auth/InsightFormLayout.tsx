import { useState, useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import {
  Award, Users, Sparkles,
  GraduationCap, BookOpen, Trophy, ShieldCheck,
} from "lucide-react";
import logo from "@/assets/logo.png";

import img1 from "@/assets/branding/Insigth-Institute-AIR-Rankers-Factory-Facebook-Cover-page-scaled.jpeg";
import img2 from "@/assets/branding/WhatsApp-Image-2025-12-19-at-7.03.13-PM.jpeg";
import img3 from "@/assets/branding/AIR-1st-Anisha-Keswani-Website-Cover-Page-1.jpeg";
import img4 from "@/assets/branding/Hunny-Manshani-Ahmedabad1st-All-India-Rank-11st-JPG.jpg";
import img5 from "@/assets/branding/cs-ronak-panjwani-company-secretary-scaled.jpg";
import img6 from "@/assets/branding/cs-aashlesha-prajapati-company-secretary-scaled.jpg";
import img7 from "@/assets/branding/Vijay-Menani-Ahmedabad5th-All-India-Rank-21st-JPG.jpg";
import img8 from "@/assets/branding/cs-mahek-sejwani-company-secretary-scaled.jpg";
import img9 from "@/assets/branding/Insights-11_2aa.jpg";

/* ─── Data ─────────────────────────────────────────────────────── */

const SLIDES = [
  { src: img1, title: "Rankers Factory", caption: "CS Executive · 3 All India Rankers" },
  { src: img2, title: "4 out of 7 AIRs", caption: "June 2025 — From Insight Institute" },
  { src: img3, title: "Anisha Keshwani", caption: "AIR 1st · CS Executive Dec'25" },
  { src: img4, title: "Hunny Manshani", caption: "Ahmedabad 1st · AIR 11th" },
  { src: img5, title: "Rohan Panjwani", caption: "Ahmedabad 1st · AIR 5th" },
  { src: img6, title: "Aashlesha Prajapati", caption: "Ahmedabad 3rd · AIR 10th" },
  { src: img7, title: "Vijay Menani", caption: "Ahmedabad 5th · AIR 21st" },
  { src: img8, title: "Mahek Sejwani", caption: "India's Youngest CS @ Age 19" },
  { src: img9, title: "Youngest CS of India", caption: "All 3 levels cleared in 1st attempt" },
];

const HIGHLIGHTS = [
  { icon: Award, title: "Experience", text: "10+ years coaching expertise" },
  { icon: ShieldCheck, title: "Expertise", text: "Exclusively CS since 2012" },
  { icon: Trophy, title: "Excellence", text: "All India & Ahmedabad Toppers" },
];

const TRUST_PILLS_DATA = [
  { icon: Users, label: "20+ Skilled Tutors" },
  { icon: GraduationCap, label: "One-to-One Coaching" },
  { icon: BookOpen, label: "Limited Students / Batch" },
];

/* ─── BrandCarousel (shared between desktop & mobile) ───────── */

function BrandCarousel({ compact = false }: { compact?: boolean }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", duration: 30 },
    [Autoplay({ delay: 3800, stopOnInteraction: false, stopOnMouseEnter: true })],
  );
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  return (
    <div className="relative w-full">
      <div
        className={`overflow-hidden shadow-2xl ring-1 ring-white/10 ${
          compact ? "rounded-xl" : "rounded-2xl"
        }`}
        ref={emblaRef}
      >
        <div className="flex">
          {SLIDES.map((s, i) => (
            <div key={i} className="relative min-w-0 flex-[0_0_100%]">
              <div
                className={`w-full bg-sidebar ${
                  compact ? "aspect-[16/9]" : "aspect-[1280/553]"
                }`}
              >
                <img
                  src={s.src}
                  alt={s.title}
                  className="h-full w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
              <div
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-sidebar/95 via-sidebar/60 to-transparent ${
                  compact ? "p-3" : "p-4 sm:p-5"
                }`}
              >
                <p
                  className={`font-heading font-semibold text-white ${
                    compact ? "text-xs" : "text-sm sm:text-base"
                  }`}
                >
                  {s.title}
                </p>
                <p
                  className={`text-white/80 ${
                    compact ? "text-[10px]" : "text-xs sm:text-sm"
                  }`}
                >
                  {s.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`flex items-center justify-center gap-1.5 ${compact ? "mt-2.5" : "mt-4"}`}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === selected ? "w-7 bg-primary" : "w-1.5 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── InsightFormLayout ─────────────────────────────────────── */

interface InsightFormLayoutProps {
  children: ReactNode;
}

export default function InsightFormLayout({ children }: InsightFormLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-sidebar relative overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen grid lg:grid-cols-[1.15fr_1fr] gap-0">
        {/* ─── LEFT — Branding + Carousel (desktop only) ─── */}
        <div className="hidden lg:flex flex-col px-10 xl:px-16 py-10 text-white">
          {/* Brand header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="rounded-md bg-white p-2 shadow-lg">
              <img src={logo} alt="Insight Institute" className="h-20" />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-10 max-w-xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Gujarat's No.1 CS Institute · Since 2012
            </div>
            <h1 className="mt-4 font-heading font-bold text-4xl xl:text-5xl leading-[1.1] tracking-tight">
              Where <span className="text-primary">Toppers</span> are
              <br /> Built, Not Born.
            </h1>
            <p className="mt-4 text-white/70 text-base max-w-md">
              Exclusively coaching Company Secretary aspirants with live classes,
              one-to-one doubt solving, and a proven record of All India Rankers.
            </p>
          </motion.div>

          {/* Desktop Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8"
          >
            <BrandCarousel />
          </motion.div>
        </div>

        {/* ─── RIGHT — Form area ─── */}
        <div className="flex flex-col items-center justify-center p-6 sm:p-10 lg:p-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Mobile brand header */}
            <div className="lg:hidden mb-5 flex items-center justify-center gap-3 text-white">
              <div className="rounded-xl bg-white p-2 shadow-lg">
                <img src={logo} alt="Insight Institute" className="h-9 w-auto" />
              </div>
              <div>
                <p className="font-heading font-bold text-lg leading-tight">Insight Institute</p>
                <p className="text-[10px] text-white/60 tracking-wider uppercase">Exclusively for CS</p>
              </div>
            </div>

            {/* Mobile Carousel — compact version shown on < lg */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:hidden mb-5"
            >
              <BrandCarousel compact />
              {/* Mobile trust pills — horizontal row */}
              <div className="mt-3 flex items-center justify-center gap-3 text-white/60">
                {TRUST_PILLS_DATA.map((p) => (
                  <div key={p.label} className="flex items-center gap-1.5">
                    <p.icon className="h-3 w-3 text-primary/80" />
                    <span className="text-[9px] font-medium">{p.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Form content (passed as children) */}
            {children}

            {/* Highlights row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 text-white"
            >
              {HIGHLIGHTS.map((h) => (
                <div
                  key={h.title}
                  className="rounded-xl bg-white/5 backdrop-blur border border-white/10 p-3 sm:p-4"
                >
                  <h.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-1.5 sm:mb-2" />
                  <p className="font-heading font-semibold text-[11px] sm:text-sm">{h.title}</p>
                  <p className="text-[9px] sm:text-xs text-white/60 mt-0.5 leading-snug">{h.text}</p>
                </div>
              ))}
            </motion.div>

            <p className="mt-6 text-center text-xs text-white/50">
              © {new Date().getFullYear()} Insight Institute of Professional Studies · Exclusively for CS since 2012
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
