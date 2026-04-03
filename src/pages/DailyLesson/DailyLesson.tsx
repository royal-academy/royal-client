// DailyLesson.tsx
import { useQuery } from "@tanstack/react-query";
import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axiosPublic from "../../hooks/axiosPublic";
import DailyLessonCard from "./DailyLessonCard";
import DatePicker, {
  BN_DAYS_FULL,
  BN_MONTHS,
} from "../../components/common/Datepicker";
import Skeleton from "../../components/common/Skeleton";
import { CLASS_COLORS, DEFAULT_CLASS_COLOR, toBn } from "../../utility/shared";
import { CLASS_ORDER } from "../../utility/Constants";
import EmptyState from "../../components/common/Emptystate";
import Button from "../../components/common/Button";

// ─── Types ────────────────────────────────────────────────
export interface DailyLessonData {
  _id: string;
  slug?: string;
  subject: string;
  teacher:
    | {
        _id: string;
        name: string;
        avatar?:
          | { url: string | null; publicId?: string | null }
          | string
          | null;
        role?: string;
        slug?: string;
      }
    | string;
  teacherSlug?: string;
  class: string;
  mark: number;
  referenceType: "chapter" | "page";
  chapterNumber: string;
  topics: string;
  images: { url: string; public_id: string }[];
  date: string;
  createdAt: string;
}

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${BN_DAYS_FULL[d.getDay()]}, ${toBn(String(d.getDate()))} ${BN_MONTHS[d.getMonth()]} ${toBn(String(d.getFullYear()))}`;
};

const todayBn = () => {
  const d = new Date();
  return `${BN_DAYS_FULL[d.getDay()]}, ${toBn(String(d.getDate()))} ${BN_MONTHS[d.getMonth()]}`;
};

const isSameDay = (iso: string, reference: Date) => {
  const d = new Date(iso);
  return (
    d.getDate() === reference.getDate() &&
    d.getMonth() === reference.getMonth() &&
    d.getFullYear() === reference.getFullYear()
  );
};

// ─── ClassGroupTitle ───────────────────────────────────────
const ClassGroupTitle = ({
  className,
  index,
  count,
}: {
  className: string;
  index: number;
  count: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.07,
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative flex items-center gap-0 mb-5 mt-10 overflow-hidden rounded bangla "
    >
      {/* Content */}
      <div className="flex-1 flex items-center justify-center gap-x-10 px-5 py-3.5 border-y border-[var(--color-active-border)] mt-5 bg-[var(--color-active-bg)]">
        <div className="flex items-center gap-3">
          <h2 className="text-xl md:text-2xl font-extrabold leading-tight text-[var(--color-text)]">
            {className}
          </h2>
        </div>

        <span className="text-xs font-black px-3 border-x border-[var(--color-gray)] text-[var(--color-gray)] ">
          {toBn(String(count))}টি পাঠ
        </span>
      </div>
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────
const DailyLesson = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerValue, setDatePickerValue] = useState<string>(todayBn());

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const { data, isLoading, isError } = useQuery<DailyLessonData[]>({
    queryKey: ["daily-lessons"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/daily-lesson");
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    refetchOnWindowFocus: true,
  });

  // Activity dots for DatePicker
  const activeDates = useMemo(() => {
    if (!data) return new Set<string>();
    const set = new Set<string>();
    data.forEach((lesson) => {
      const d = new Date(lesson.date);
      set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return set;
  }, [data]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((lesson) => isSameDay(lesson.date, selectedDate));
  }, [data, selectedDate]);

  const groupedByClass = useMemo(() => {
    const map = new Map<string, DailyLessonData[]>();
    filteredData.forEach((lesson) => {
      if (!map.has(lesson.class)) map.set(lesson.class, []);
      map.get(lesson.class)!.push(lesson);
    });
    map.forEach((lessons) =>
      lessons.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
    return Array.from(map.entries())
      .sort(([a], [b]) => (CLASS_ORDER[a] ?? 99) - (CLASS_ORDER[b] ?? 99))
      .map(([className, lessons]) => ({ className, lessons }));
  }, [filteredData]);

  const handleReset = () => {
    setSelectedDate(new Date());
    setDatePickerValue(todayBn());
  };

  if (isLoading) return <Skeleton variant="daily-lesson" />;

  return (
    <div className="relative">
      {/* ── Header ── */}
      <header className="text-center bangla mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-2xl md:text-5xl font-bold text-[var(--color-text)]"
        >
          আজকের পড়া
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5 }}
          className="text-base md:text-2xl font-medium text-[var(--color-gray)] mt-2"
        >
          প্রতিদিনের পাঠ্যক্রম ও নির্দেশনা
        </motion.p>
      </header>

      {/* ── Date Filter Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4 }}
        className="flex flex-wrap items-center gap-3 px-3 md:px-0 mb-6 bangla"
      >
        <div className="w-full sm:w-72 relative">
          <DatePicker
            value={datePickerValue}
            onDateChange={(date) => setSelectedDate(date)}
            onChange={(val) => setDatePickerValue(val)}
            placeholder="অন্য তারিখ বেছে নিন"
            maxDate={new Date()}
            activeDates={activeDates}
          />
        </div>

        <AnimatePresence mode="wait">
          {filteredData.length > 0 && (
            <motion.span
              key={selectedDate.toDateString()}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="ml-auto text-sm text-[var(--color-gray)]"
            >
              মোট{" "}
              <span className="font-bold text-[var(--color-text)]">
                {toBn(String(filteredData.length))}
              </span>
              টি পাঠ
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Content ── */}
      {isError ? (
        <div className="text-center py-20 text-rose-400 text-sm bangla">
          ডেটা লোড করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate.toDateString()}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="px-3 md:px-0"
          >
            {groupedByClass.length > 0 ? (
              groupedByClass.map(({ className, lessons }, groupIndex) => {
                const color = CLASS_COLORS[className] ?? DEFAULT_CLASS_COLOR;
                return (
                  <div key={className}>
                    <ClassGroupTitle
                      className={className}
                      index={groupIndex}
                      count={lessons.length}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 mb-6">
                      {lessons.map((lesson, i) => (
                        <DailyLessonCard
                          key={lesson._id}
                          lesson={{
                            ...lesson,

                            date: formatDate(lesson.date),
                          }}
                          index={i}
                          classColor={color}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                message="কিছু নেই"
                action={
                  <Button onClick={handleReset} className="btn">
                    আজকের পাঠ দেখুন
                  </Button>
                }
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default DailyLesson;
