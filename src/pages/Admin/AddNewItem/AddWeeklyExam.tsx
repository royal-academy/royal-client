// AddWeeklyExam.tsx
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Loader2, ImagePlus, X } from "lucide-react";
import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PiChalkboardTeacherFill } from "react-icons/pi";
import type { SelectOption } from "../../../components/common/SelectInput";
import axiosPublic from "../../../hooks/axiosPublic";
import SelectInput from "../../../components/common/SelectInput";
import Skeleton from "../../../components/common/Skeleton";
import ErrorState from "../../../components/common/ErrorState";
import { useAuth } from "../../../context/AuthContext";
import { CLASS_OPTIONS, getSubjects } from "../../../utility/Constants";

// ─── Types ────────────────────────────────────────────────
interface WeeklyExamFormData {
  subject: string;
  teacher: string;
  class: string;
  mark: number;
  ExamNumber: string;
  chapterNumber: string;
  topics: string;
  slug?: string;
}

interface TeacherItem {
  name: string;
  slug: string;
  role: string;
}

// ─── Bangla numeral helpers ────────────────────────────────
const EN_TO_BN: Record<string, string> = {
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
};

const toBanglaDigits = (str: string): string =>
  str.replace(/[0-9]/g, (d) => EN_TO_BN[d] ?? d);

const toAsciiDigits = (str: string): string =>
  str
    .replace(/০/g, "0")
    .replace(/১/g, "1")
    .replace(/২/g, "2")
    .replace(/৩/g, "3")
    .replace(/৪/g, "4")
    .replace(/৫/g, "5")
    .replace(/৬/g, "6")
    .replace(/৭/g, "7")
    .replace(/৮/g, "8")
    .replace(/৯/g, "9");

const validatePositiveNumber = (
  raw: string,
  fieldLabel: string,
): string | true => {
  if (!raw) return `${fieldLabel} আবশ্যিক`;

  const ascii = toAsciiDigits(raw).trim();
  if (!/^\d+$/.test(ascii)) return "শুধু পূর্ণসংখ্যা দিন (যেমন: ১, ২, ৩)";
  if (parseInt(ascii) <= 0) return "নম্বর ০-এর চেয়ে বড় হতে হবে";

  return true;
};

// ─── Static Data ──────────────────────────────────────────
const MARK_OPTIONS: SelectOption[] = [5, 10, 15, 20, 25, 30, 35, 40].map(
  (n) => ({
    value: String(n),
    label: toBanglaDigits(String(n)),
  }),
);

// ─── Styles ───────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.38, ease: "easeOut" },
  }),
};

/**
 * Border logic:
 *   isError              → rose-400 (red)
 *   isTouched & no error → emerald-400 (green) — field is valid
 *   default              → neutral active border
 */
const inputCls = (isError: boolean, isValidTouched = false) =>
  `w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200
   focus:outline-none focus:ring-2 focus:border-transparent
   bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-gray)]
   ${
     isError
       ? "border-rose-400 focus:ring-rose-400"
       : isValidTouched
         ? "border-emerald-400 focus:ring-emerald-400"
         : "border-[var(--color-active-border)] focus:ring-violet-500"
   }`;

const labelCls =
  "block text-xs font-semibold tracking-wide uppercase text-[var(--color-gray)] mb-1.5";

const RequiredStar = () => (
  <span className="text-rose-500 normal-case tracking-normal font-normal">
    *
  </span>
);

const ErrorMsg = ({ msg }: { msg?: string }) => (
  <AnimatePresence>
    {msg && (
      <motion.p
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="text-rose-500 text-xs mt-1 bangla"
      >
        {msg}
      </motion.p>
    )}
  </AnimatePresence>
);

// ─── Reusable Bangla number text input ────────────────────
const BanglaNumberInput = ({
  value,
  onChange,
  onBlur,
  isError,
  isValidTouched,
  placeholder = "যেমন: ১, ৫, ২.৫",
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  isError: boolean;
  isValidTouched: boolean;
  placeholder?: string;
}) => (
  <input
    type="text"
    inputMode="decimal"
    placeholder={placeholder}
    value={value}
    onChange={(e) => {
      const value = e.target.value.replace(/[^\d০-৯]/g, "");
      onChange(toBanglaDigits(value));
    }}
    onBlur={onBlur}
    className={`${inputCls(isError, isValidTouched)} bangla`}
  />
);

// ═════════════════════════════════════════════════════════
// Component
// ═════════════════════════════════════════════════════════
const AddWeeklyExam = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const [submitted, setSubmitted] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  // ── Fetch teachers ─────────────────────────────────────
  const {
    data: teacherList = [],
    isLoading: teachersLoading,
    isError: teachersError,
  } = useQuery<TeacherItem[]>({
    queryKey: ["teachers-list"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/users");
      const payload: TeacherItem[] = Array.isArray(res.data)
        ? res.data
        : (res.data?.data ?? []);
      const staff = payload.filter((t) =>
        ["teacher", "principal", "admin"].includes(t.role),
      );
      if (
        user?.name &&
        user?.slug &&
        !staff.some((t) => t.slug === user.slug)
      ) {
        staff.unshift({ name: user.name, slug: user.slug, role: user.role });
      }
      return staff;
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const teacherOptions: SelectOption[] = teacherList.map((t) => ({
    value: t.name,
    label: t.name,
    icon: <PiChalkboardTeacherFill />,
  }));

  // ── Form — onTouched triggers validation after first blur ──
  const {
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<WeeklyExamFormData>({
    mode: "onTouched",
    defaultValues: {
      subject: "",
      teacher: "",
      class: "",
      mark: 0,
      ExamNumber: "",
      chapterNumber: "",
      topics: "",
    },
  });

  const selectedClass = watch("class");
  const teacherValue = watch("teacher");

  useEffect(() => {
    if (!user?.name) return;
    if (isAdmin && teacherList.length === 0) return;
    if (teacherValue) return;
    setValue("teacher", user.name, { shouldValidate: true, shouldTouch: true });
  }, [user?.name, isAdmin, teacherList.length, teacherValue, setValue]);

  // ── Image handlers ─────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setImageFiles((p) => [...p, ...files]);
    setPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeImage = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setImageFiles((p) => p.filter((_, j) => j !== i));
    setPreviews((p) => p.filter((_, j) => j !== i));
  };

  // ── Mutation ───────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (fd: FormData) =>
      axiosPublic.post("/api/weekly-exams", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      toast.success("পরীক্ষা সফলভাবে যোগ হয়েছে!");
      qc.invalidateQueries({ queryKey: ["weekly-exams"] });
      reset();
      setImageFiles([]);
      setPreviews([]);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to create exam",
      ),
  });

  const onSubmit: SubmitHandler<WeeklyExamFormData> = (data) => {
    const fd = new FormData();
    const normalised = {
      ...data,
      ExamNumber: toAsciiDigits(data.ExamNumber),
      chapterNumber: toAsciiDigits(data.chapterNumber),
    };
    (Object.keys(normalised) as (keyof WeeklyExamFormData)[]).forEach((k) => {
      if (normalised[k] !== undefined) fd.append(k, String(normalised[k]));
    });
    if (!isAdmin && user?.name) fd.set("teacher", user.name);
    if (user?.slug) fd.append("teacherSlug", user.slug);
    imageFiles.forEach((f) => fd.append("images", f));
    mutation.mutate(fd);
  };

  const handleReset = () => {
    reset();
    setImageFiles([]);
    setPreviews([]);
  };

  // ── Guards ─────────────────────────────────────────────
  if (isAdmin && teachersLoading) return <Skeleton variant="add-lesson" />;
  if (isAdmin && teachersError)
    return (
      <ErrorState message="শিক্ষকের তালিকা লোড হয়নি। পৃষ্ঠাটি রিফ্রেশ করুন।" />
    );

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-start justify-center py-10">
      <div className="w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
            <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight bangla">
              সাপ্তাহিক পরীক্ষা যোগ করুন
            </h1>
          </div>
          <p className="text-sm text-[var(--color-gray)] ml-4 pl-3 bangla">
            নিচের ফর্মটি পূরণ করুন। সকল <span className="text-rose-500">*</span>{" "}
            চিহ্নিত ঘর আবশ্যিক।
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-[var(--color-bg)] rounded-2xl shadow-sm border border-[var(--color-active-border)] p-6 sm:p-8"
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* ── Row 1: Class + Subject ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <motion.div
                custom={0}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <Controller
                  name="class"
                  control={control}
                  rules={{ required: "শ্রেণি আবশ্যিক" }}
                  render={({ field, fieldState }) => (
                    <SelectInput
                      label="শ্রেণি"
                      required
                      placeholder="শ্রেণি বেছে নিন"
                      options={CLASS_OPTIONS}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        setValue("subject", "", { shouldTouch: false });
                      }}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                      isTouched={fieldState.isTouched}
                    />
                  )}
                />
              </motion.div>

              <motion.div
                custom={1}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <Controller
                  name="subject"
                  control={control}
                  rules={{ required: "বিষয় আবশ্যিক" }}
                  render={({ field, fieldState }) => (
                    <SelectInput
                      label="বিষয়"
                      required
                      placeholder={
                        selectedClass ? "বিষয় বেছে নিন" : "আগে শ্রেণি বেছে নিন"
                      }
                      options={getSubjects(selectedClass)}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={!selectedClass}
                      error={fieldState.error?.message}
                      isTouched={fieldState.isTouched}
                    />
                  )}
                />
              </motion.div>
            </div>

            {/* ── Row 2: Teacher ── */}
            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              {isAdmin ? (
                <Controller
                  name="teacher"
                  control={control}
                  rules={{ required: "শিক্ষকের নাম আবশ্যিক" }}
                  render={({ field, fieldState }) => (
                    <SelectInput
                      label="শিক্ষকের নাম"
                      required
                      placeholder="শিক্ষক বেছে নিন"
                      options={teacherOptions}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                      isTouched={fieldState.isTouched}
                    />
                  )}
                />
              ) : (
                <div>
                  <label className={labelCls}>
                    শিক্ষকের নাম <RequiredStar />
                  </label>
                  {/* Read-only: always valid, show green */}
                  <div
                    className={`${inputCls(false, true)} flex items-center gap-2 opacity-70 cursor-not-allowed`}
                  >
                    <PiChalkboardTeacherFill className="w-4 h-4 text-violet-500 shrink-0" />
                    <span className="text-[var(--color-text)]">
                      {user?.name ?? "..."}
                    </span>
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-active-bg)] text-violet-500 font-medium uppercase tracking-wide">
                      {user?.role}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* ── Row 3: পরীক্ষা নম্বর + পূর্ণমান ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <label className={labelCls}>
                  পরীক্ষা নম্বর <RequiredStar />
                </label>
                <Controller
                  name="ExamNumber"
                  control={control}
                  rules={{
                    validate: (v) => validatePositiveNumber(v, "পরীক্ষা নম্বর"),
                  }}
                  render={({ field, fieldState }) => (
                    <BanglaNumberInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      isError={!!fieldState.error}
                      isValidTouched={fieldState.isTouched && !fieldState.error}
                      placeholder="যেমন: ১, ২, ৩"
                    />
                  )}
                />
                <ErrorMsg msg={errors.ExamNumber?.message} />
              </motion.div>

              <motion.div
                custom={4}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <Controller
                  name="mark"
                  control={control}
                  rules={{
                    required: "পূর্ণমান আবশ্যিক",
                    validate: (v) => v > 0 || "পূর্ণমান আবশ্যিক",
                  }}
                  render={({ field, fieldState }) => (
                    <SelectInput
                      label="পূর্ণমান"
                      required
                      placeholder="পূর্ণমান বেছে নিন"
                      options={MARK_OPTIONS}
                      value={field.value ? String(field.value) : ""}
                      onChange={(val) => field.onChange(Number(val))}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                      isTouched={fieldState.isTouched}
                    />
                  )}
                />
              </motion.div>
            </div>

            {/* ── Row 4: অধ্যায়/পৃষ্ঠা নং ── */}
            <motion.div
              custom={5}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <label className={labelCls}>
                অধ্যায়/পৃষ্ঠা নং <RequiredStar />
              </label>
              <Controller
                name="chapterNumber"
                control={control}
                rules={{
                  validate: (v) =>
                    validatePositiveNumber(v, "অধ্যায়/পৃষ্ঠা নম্বর"),
                }}
                render={({ field, fieldState }) => (
                  <BanglaNumberInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    isError={!!fieldState.error}
                    isValidTouched={fieldState.isTouched && !fieldState.error}
                  />
                )}
              />
              <ErrorMsg msg={errors.chapterNumber?.message} />
            </motion.div>

            {/* ── Row 5: Topics ── */}
            <motion.div
              custom={6}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <label className={labelCls}>
                বিষয়বস্তু / নির্দেশনা <RequiredStar />
              </label>
              <Controller
                name="topics"
                control={control}
                rules={{
                  required: "বিষয়বস্তু আবশ্যিক",
                  minLength: { value: 20, message: "কমপক্ষে ২০ অক্ষর লিখুন" },
                }}
                render={({ field, fieldState }) => (
                  <textarea
                    rows={5}
                    placeholder="পরীক্ষার বিষয়বস্তু লিখুন..."
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className={`${inputCls(
                      !!fieldState.error,
                      fieldState.isTouched && !fieldState.error,
                    )} resize-none leading-relaxed bangla`}
                  />
                )}
              />
              <ErrorMsg msg={errors.topics?.message} />
            </motion.div>

            {/* ── Row 6: Image Upload ── */}
            <motion.div
              custom={7}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <label className={labelCls}>ছবি সংযুক্ত করুন (ঐচ্ছিক)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-[var(--color-active-border)] hover:border-violet-400 dark:hover:border-violet-500 rounded-xl p-6 flex flex-col items-center gap-2 transition-colors group"
              >
                <ImagePlus className="w-8 h-8 text-[var(--color-gray)] group-hover:text-violet-500 transition-colors" />
                <p className="text-sm text-[var(--color-gray)] group-hover:text-violet-500 transition-colors bangla">
                  ক্লিক করুন বা ছবি টেনে আনুন
                </p>
                <p className="text-xs text-[var(--color-gray)] bangla">
                  PNG, JPG, WEBP • একাধিক ছবি বেছে নেওয়া যাবে
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              <AnimatePresence>
                {previews.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-4"
                  >
                    {previews.map((src, i) => (
                      <motion.div
                        key={src}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--color-active-border)]"
                      >
                        <img
                          src={src}
                          alt={`preview-${i}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {previews.length > 0 && (
                <p className="text-xs text-[var(--color-gray)] mt-2 bangla">
                  {toBanglaDigits(String(previews.length))}টি ছবি নির্বাচিত
                </p>
              )}
            </motion.div>

            <div className="border-t border-[var(--color-active-border)] pt-2" />

            {/* ── Buttons ── */}
            <motion.div
              custom={8}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-3"
            >
              <button
                type="submit"
                disabled={!isValid || mutation.isPending}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 bangla
                  ${
                    isValid && !mutation.isPending
                      ? "bg-[var(--color-text)] text-[var(--color-bg)] shadow-md hover:shadow-lg hover:-translate-y-0.5"
                      : "bg-[var(--color-active-bg)] text-[var(--color-gray)] cursor-not-allowed"
                  }`}
              >
                <AnimatePresence mode="wait">
                  {mutation.isPending ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" /> সংরক্ষণ
                      হচ্ছে…
                    </motion.span>
                  ) : submitted ? (
                    <motion.span
                      key="done"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      ✓ সফলভাবে যোগ হয়েছে
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      পরীক্ষা যোগ করুন
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={mutation.isPending}
                className="sm:w-32 py-3 rounded-xl text-sm font-medium bg-[var(--color-active-bg)] hover:bg-[var(--color-active-border)] text-[var(--color-text)] transition-all disabled:opacity-50 bangla"
              >
                রিসেট
              </button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddWeeklyExam;
