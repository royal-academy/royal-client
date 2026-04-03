// src/components/WeeklyExam/ExamModal.tsx
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import {
  X,
  Copy,
  Check,
  Calendar,
  GraduationCap,
  FileText,
  Folder,
} from "lucide-react";
import "swiper/css";
import "swiper/css/pagination";
import {
  AnimatedSlide,
  SlideDots,
  SlideProgress,
  toBn,
  type ColorConfig,
  type Exam,
} from "../../utility/shared";

interface ExamModalProps {
  exam: Exam;
  color: ColorConfig;
  onClose: () => void;
}

// ── Utility ───────────────────────────────────────────────────────────────────
const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
};

const getInitial = (subject: string) => subject?.charAt(0) ?? "?";

// ── ExamModal ─────────────────────────────────────────────────────────────────
const ExamModal = ({ exam, color, onClose }: ExamModalProps) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const hasImages = Array.isArray(exam.images) && exam.images.length > 0;
  const multipleImages = hasImages && (exam.images?.length ?? 0) > 1;
  const accentRgb = hexToRgb(color.from);

  // ── Lock body scroll & Escape key ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // ── Copy handler ─────────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    const text = [
      `পরীক্ষা নং = ${exam.ExamNumber}`,
      `${exam.class} = ${exam.subject} - ${exam.mark} নম্বর`,
      ``,
      exam.topics,
    ].join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  }, [exam]);

  return createPortal(
    <AnimatePresence>
      {/* ── Backdrop ── */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
        className="fixed inset-0 z-[200]"
        style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
      />

      {/* ── Modal / Bottom Sheet ── */}
      <motion.div
        key="sheet"
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="fixed z-[201] inset-0  flex items-center justify-center md:p-6 bangla"
      >
        <div
          className="relative w-full  bg-[var(--color-bg)] rounded-xl overflow-hidden"
          style={{
            boxShadow: `0 0 0 1px rgba(${accentRgb}, 0.15), 0 -8px 60px rgba(${accentRgb}, 0.18), 0 32px 80px rgba(0,0,0,0.45)`,
            height: "clamp(200px, 55vw, 380px)",
            minHeight: "200px",
          }}
        >
          {/* Scrollable area */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: "92dvh", scrollbarWidth: "none" }}
          >
            {/* Mobile drag handle */}
            <div className="md:hidden flex justify-center pt-4 pb-2">
              <div
                className="w-10 h-1 rounded-full opacity-40"
                style={{ background: color.from }}
              />
            </div>

            {/* ══ IMAGE MODE ══════════════════════════════════════════════ */}
            {hasImages ? (
              <>
                {/* Swiper hero */}
                <div
                  className="relative"
                  style={{ height: "clamp(200px, 55vw, 380px)" }}
                >
                  {multipleImages && (
                    <SlideProgress key={progressKey} color={color} />
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/55 via-transparent to-black/25" />

                  <Swiper
                    onSlideChange={(s) => {
                      setActiveSlide(s.realIndex);
                      setProgressKey((k) => k + 1);
                    }}
                    modules={[Pagination, Autoplay]}
                    autoplay={
                      multipleImages
                        ? {
                            delay: 3500,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true,
                          }
                        : false
                    }
                    loop={multipleImages}
                    className="w-full h-full"
                  >
                    {exam.images!.map((img, i) => (
                      <SwiperSlide key={i}>
                        <AnimatedSlide img={img} isActive={i === activeSlide} />
                      </SwiperSlide>
                    ))}
                  </Swiper>

                  {multipleImages && (
                    <SlideDots
                      count={exam.images!.length}
                      active={activeSlide}
                      color={color}
                    />
                  )}

                  {/* Exam badge */}
                  <div className="absolute top-4 left-4 z-20">
                    <div
                      className="px-3 py-1.5 rounded-xl text-white font-black text-xs backdrop-blur-md"
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    >
                      পরীক্ষা নং {toBn(exam.ExamNumber)}
                    </div>
                  </div>

                  {/* Close button */}
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-red-600 text-white"
                    style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                    aria-label="বন্ধ করুন"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Subject row (image mode) */}
                <div
                  className="relative px-5 pt-5 pb-4"
                  style={{
                    background: `linear-gradient(160deg, ${color.from}14 0%, ${color.to}08 60%, transparent 100%)`,
                  }}
                >
                  {/* Section label */}
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-1 h-5 rounded-full"
                      style={{
                        background: `linear-gradient(180deg, ${color.from}, ${color.to})`,
                      }}
                    />
                    <span
                      className="text-[10px] font-black uppercase tracking-[0.14em]"
                      style={{ color: color.from }}
                    >
                      সাপ্তাহিক পরীক্ষা
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <h2 className="text-2xl font-black text-[var(--color-text)] text-center">
                      {exam.subject}
                    </h2>

                    {exam.teacher && (
                      <p
                        className="flex items-center gap-1.5 text-sm font-semibold"
                        style={{ color: color.from }}
                      >
                        <Folder className="w-4 h-4" />
                        {exam.teacher}
                      </p>
                    )}

                    {/* Pills */}
                    <div className="flex flex-wrap justify-center gap-2 mt-1">
                      {[
                        {
                          icon: <GraduationCap className="w-3.5 h-3.5" />,
                          label: exam.class,
                        },
                        {
                          icon: <FileText className="w-3.5 h-3.5" />,
                          label: `${toBn(exam.mark)} নম্বর`,
                        },
                        {
                          icon: <Calendar className="w-3.5 h-3.5" />,
                          label: exam.date,
                        },
                      ].map((pill, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.06 + i * 0.07 }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl select-none"
                          style={{
                            background: `${color.from}14`,
                            color: color.text,
                          }}
                        >
                          {pill.icon}
                          {pill.label}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* ══ NO-IMAGE MODE ══════════════════════════════════════════ */
              <div
                className="relative px-5 pt-5 pb-6"
                style={{
                  background: `linear-gradient(160deg, ${color.from}14 0%, ${color.to}08 60%, transparent 100%)`,
                }}
              >
                {/* Close button */}
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-red-600 text-white"
                  aria-label="বন্ধ করুন"
                >
                  <X className="w-4 h-4" />
                </motion.button>

                {/* Section label */}
                <div className="flex items-center gap-2 mb-5">
                  <div
                    className="w-1 h-5 rounded-full"
                    style={{
                      background: `linear-gradient(180deg, ${color.from}, ${color.to})`,
                    }}
                  />
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.14em]"
                    style={{ color: color.from }}
                  >
                    সাপ্তাহিক পরীক্ষা
                  </span>
                </div>

                {/* Avatar + Title */}
                <div className="flex flex-col items-center gap-4">
                  {/* Avatar circle */}
                  <div className="relative shrink-0">
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        delay: 0.1,
                      }}
                      className="w-24 h-24 rounded-full flex items-center justify-center font-black text-3xl text-white shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                      }}
                    >
                      {getInitial(exam.subject)}
                    </motion.div>

                    {/* Pulse dot */}
                    <span
                      className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full border-2 border-[var(--color-bg)] animate-pulse"
                      style={{ background: color.from }}
                    />

                    {/* Exam number badge on avatar */}
                    <span
                      className="absolute -top-1 -left-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow"
                      style={{ background: color.from }}
                    >
                      {toBn(exam.ExamNumber)}
                    </span>
                  </div>

                  {/* Subject + teacher */}
                  <div className="flex flex-col items-center gap-1 pr-8">
                    <h2 className="text-2xl font-black text-[var(--color-text)] text-center">
                      {exam.subject}
                    </h2>
                    {exam.teacher && (
                      <p
                        className="flex items-center gap-1.5 text-sm font-semibold"
                        style={{ color: color.from }}
                      >
                        <Folder className="w-4 h-4" />
                        {exam.teacher}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pills */}
                <div className="flex flex-wrap justify-center gap-2 mt-5">
                  {[
                    {
                      icon: <GraduationCap className="w-3.5 h-3.5" />,
                      label: exam.class,
                    },
                    {
                      icon: <FileText className="w-3.5 h-3.5" />,
                      label: `${toBn(exam.mark)} নম্বর`,
                    },
                    {
                      icon: <Calendar className="w-3.5 h-3.5" />,
                      label: exam.date,
                    },
                  ].map((pill, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + i * 0.07 }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl select-none"
                      style={{
                        background: `${color.from}14`,
                        color: color.text,
                      }}
                    >
                      {pill.icon}
                      {pill.label}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Gradient divider */}
            <div
              className="h-px mx-5"
              style={{
                background: `linear-gradient(90deg, ${color.from}50, ${color.to}30, transparent)`,
              }}
            />

            {/* ── Body: Topics ── */}
            <div className="px-5 py-6">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-1 h-5 rounded-full"
                  style={{
                    background: `linear-gradient(180deg, ${color.from}, ${color.to})`,
                  }}
                />
                <span
                  className="text-[10px] font-black uppercase tracking-[0.12em]"
                  style={{ color: color.from }}
                >
                  বিষয়বস্তু ও নির্দেশনা
                </span>
              </div>

              <p className="text-sm sm:text-base leading-loose text-[var(--color-text)] whitespace-pre-line bangla">
                {exam.topics}
              </p>
            </div>

            {/* ── Footer ── */}
            <div
              className="flex items-center justify-between gap-3 px-5 py-4 border-t"
              style={{ borderColor: `${color.from}20` }}
            >
              <p className="text-[11px] text-[var(--color-gray)] leading-snug">
                পরীক্ষা নং · শ্রেণি · বিষয় · নম্বর · বিষয়বস্তু কপি হবে
              </p>

              <motion.button
                onClick={handleCopy}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                aria-label={copied ? "কপি সম্পন্ন" : "কপি করুন"}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black shrink-0 transition-all duration-200 bangla"
                style={
                  copied
                    ? { background: "#dcfce7", color: "#15803d" }
                    : {
                        background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                        color: "#fff",
                        boxShadow: `0 4px 14px rgba(${accentRgb}, 0.35)`,
                      }
                }
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> কপি হয়েছে
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Copy className="w-4 h-4" /> কপি করুন
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            {/* Mobile bottom handle */}
            <div className="md:hidden flex justify-center pb-3 pt-1">
              <div
                className="w-9 h-1 rounded-full opacity-30"
                style={{ background: color.from }}
              />
            </div>

            {/* Safe area */}
            <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

export default ExamModal;
