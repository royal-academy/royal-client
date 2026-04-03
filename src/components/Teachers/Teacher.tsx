// src/components/Teachers/Teacher.tsx
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import axiosPublic from "../../hooks/axiosPublic";
import TeacherCard, { type TeacherData } from "./TeacherCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";
import "swiper/css/autoplay";

// ── Skeleton Card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex flex-col items-center gap-3 px-4 py-5 rounded-2xl mx-3 animate-pulse bg-[var(--color-active-bg)] border border-[var(--color-active-border)] ">
    <div className="w-14 h-14 rounded-xl bg-[var(--color-active-border)] " />
    <div className="w-full flex flex-col items-center gap-2 bg-[var(--color-active-border)]">
      <div className="h-2.5 w-4/5 rounded-full" />
      <div className="h-2 w-1/2 rounded-full bg-[var(--color-active-border)]" />
    </div>
  </div>
);

const skeletons = Array.from({ length: 6 });

// ── Main ──────────────────────────────────────────────────────────────────────
const Teacher = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/users");
      const result: TeacherData[] = res.data?.data ?? res.data ?? [];
      return result;
    },
  });

  const teachers = (data ?? []).filter(
    (t) => t.role === "teacher" || t.role === "admin" || t.role === "principal",
  );

  return (
    <section className="py-12 bg-[var(--color-bg)] relative">
      <div className="w-full h-px  bg-[var(--color-active-border)]" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="px-6 mt-16 mb-8 text-center bangla"
      >
        <h2 className="text-3xl sm:text-4xl font-bold  tracking-wider text-[var(--color-text)]">
          শিক্ষক মন্ডলী
        </h2>
        <p className="text-xl md:text-2xl mt-2  text-[var(--color-gray)]">
          আমাদের অভিজ্ঞ ও দক্ষ শিক্ষকবৃন্দ
        </p>
      </motion.div>

      {/* Content */}
      {isError ? (
        <p className="text-center text-sm bangla text-[var(--color-gray)]">
          তথ্য লোড করতে সমস্যা হয়েছে।
        </p>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Swiper
            effect="coverflow"
            grabCursor={true}
            centeredSlides={true}
            slidesPerView="auto"
            loop={true}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            coverflowEffect={{
              rotate: 50,
              stretch: 0,
              depth: 100,
              modifier: 1,
              slideShadows: true,
            }}
            modules={[EffectCoverflow, Autoplay]}
            className="mySwiper"
          >
            {isLoading
              ? skeletons.map((_, i) => (
                  <SwiperSlide key={i} style={{ width: "fit-content" }}>
                    <SkeletonCard />
                  </SwiperSlide>
                ))
              : teachers.map((t) => (
                  <SwiperSlide key={t._id} style={{ width: "fit-content" }}>
                    <TeacherCard teacher={t} />
                  </SwiperSlide>
                ))}
          </Swiper>
        </motion.div>
      )}
    </section>
  );
};

export default Teacher;
