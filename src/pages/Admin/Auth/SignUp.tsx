// src/pages/Admin/Auth/Signup.tsx
import { useState, useMemo, useCallback, useEffect, useRef } from "react";

const toLocalIso = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import {
  User,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  BookOpen,
  Hash,
  School,
  PhoneCall,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";
import axiosPublic, {
  getApiMessage,
  TOKEN_KEY,
} from "../../../hooks/axiosPublic";

import { useAuth } from "../../../context/AuthContext";
import type { AuthUser } from "../../../context/AuthContext";
import { getDivisions, getDistricts, getThanas } from "../../../data/bd-geo";
import {
  banglaOnly,
  getFieldState,
  slideVariants,
  slideTrans,
  ValidatedInput,
  PasswordInput,
  CardBtn,
  GridBtn,
  GenderBtn,
  ReligionBtn,
  PrimaryBtn,
  SubmitBtn,
  SecondaryBtn,
  NavRow,
  StepShell,
  TogglePermanent,
  ValidationMsg,
  SummaryBox,
  AvatarPicker,
  PageShell,
} from "./SignupComponents";
import SelectInput from "../../../components/common/SelectInput";
import DatePicker from "../../../components/common/Datepicker";
import {
  CLASSES,
  CLASSES_WITH_SUBJECT,
  DEGREES,
  RELIGIONS,
  SUBJECTS,
  YEARS,
  type FieldState,
  type Gender,
  type Religion,
  type SignupForm,
} from "../../../utility/Constants";

interface PhoneCheckResult {
  name: string;
  role: "teacher" | "principal" | "admin";
}

// ─── Staff phone check step ───────────────────────────────────────────────────
const StaffPhoneCheck = ({
  onVerified,
  onBack,
}: {
  onVerified: (phone: string, result: PhoneCheckResult) => void;
  onBack: () => void;
}) => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FIX 4: validate against both Bangla and ASCII digits for phone pattern
  const rawDigits = phone
    .replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d).toString())
    .replace(/[^0-9]/g, "");
  const valid = /^01[3-9]\d{8}$/.test(rawDigits);

  const handleCheck = async () => {
    if (!valid) return;
    setLoading(true);
    setError(null);
    try {
      // Send raw ASCII digits to API
      const { data } = await axiosPublic.post("/api/auth/check-staff-phone", {
        phone: rawDigits,
      });
      onVerified(rawDigits, data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "যাচাই করা সম্ভব হয়নি");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepShell
      title="আপনার ফোন নম্বর দিন"
      subtitle="প্রশাসক আপনার জন্য যে নম্বর নিবন্ধন করেছেন"
    >
      <div className="space-y-3">
        {/* FIX 4: numericOnly so digits show as Bangla */}
        <ValidatedInput
          autoFocus
          type="tel"
          numericOnly
          state={phone ? (valid ? "valid" : "error") : "idle"}
          iconLeft={Phone}
          placeholder="০১XXXXXXXXX"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setError(null);
          }}
          error={!valid && phone ? "সঠিক বাংলাদেশি নম্বর দিন" : undefined}
        />
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-xs bangla flex items-center gap-1"
          >
            ⚠️ {error}
          </motion.p>
        )}
      </div>
      <div className="flex justify-between mt-6">
        <SecondaryBtn onClick={onBack}>
          <ChevronLeft size={15} /> পেছনে
        </SecondaryBtn>
        <PrimaryBtn disabled={!valid || loading} onClick={handleCheck}>
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> যাচাই হচ্ছে...
            </>
          ) : (
            <>
              যাচাই করুন <ChevronRight size={15} />
            </>
          )}
        </PrimaryBtn>
      </div>
    </StepShell>
  );
};

// ─── Geo address block ────────────────────────────────────────────────────────
const GeoAddressFields = ({
  prefix = "",
  register,
  errors,
  fs,
  division,
  setDivision,
  district,
  setDistrict,
  thana,
  setThana,
  showLandmark = false,
  permanentSame,
  setPermanentSame,
}: {
  prefix?: string;
  register: ReturnType<typeof useForm<SignupForm>>["register"];
  errors: ReturnType<typeof useForm<SignupForm>>["formState"]["errors"];
  fs: (name: keyof SignupForm) => FieldState;
  division: string;
  setDivision: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  thana: string;
  setThana: (v: string) => void;
  showLandmark?: boolean;
  permanentSame?: boolean | null;
  setPermanentSame?: (v: boolean) => void;
}) => {
  const villageKey = (
    prefix ? `${prefix}GramNam` : "gramNam"
  ) as keyof SignupForm;
  const paraKey = (prefix ? `${prefix}Para` : "para") as keyof SignupForm;

  const divisionOptions = getDivisions().map((d) => ({ value: d, label: d }));
  const districtOptions = division
    ? getDistricts(division).map((d) => ({ value: d, label: d }))
    : [];
  const thanaOptions =
    division && district
      ? getThanas(division, district).map((t) => ({ value: t, label: t }))
      : [];

  return (
    <div className="space-y-3">
      {/* FIX 3: single column on mobile, 2 col on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <ValidatedInput
          state={fs(villageKey)}
          iconLeft={MapPin}
          label="গ্রাম/মহল্লা *"
          placeholder="গ্রাম বা মহল্লার নাম"
          error={errors[villageKey]?.message}
          {...register(villageKey, {
            required: "গ্রামের নাম লিখুন",
            validate: banglaOnly("গ্রামের নাম"),
          })}
        />
        <ValidatedInput
          state={fs(paraKey)}
          iconLeft={MapPin}
          label="পাড়া"
          placeholder="পাড়ার নাম"
          {...register(paraKey)}
        />
      </div>

      <SelectInput
        label="বিভাগ *"
        value={division}
        onChange={(v) => {
          setDivision(v);
          setDistrict("");
          setThana("");
        }}
        placeholder="বিভাগ নির্বাচন করুন"
        options={divisionOptions}
      />

      {/* FIX 3: single column on mobile, 2 col on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <SelectInput
          label="জেলা *"
          value={district}
          onChange={(v) => {
            setDistrict(v);
            setThana("");
          }}
          placeholder={division ? "জেলা নির্বাচন করুন" : "আগে বিভাগ বাছুন"}
          options={districtOptions}
          disabled={!division}
        />
        <SelectInput
          label="থানা/উপজেলা *"
          value={thana}
          onChange={setThana}
          placeholder={district ? "থানা নির্বাচন করুন" : "আগে জেলা বাছুন"}
          options={thanaOptions}
          disabled={!district}
        />
      </div>

      {showLandmark && (
        <>
          {setPermanentSame && (
            <TogglePermanent
              value={permanentSame ?? null}
              onChange={setPermanentSame}
            />
          )}
          <ValidatedInput
            state="idle"
            iconLeft={MapPin}
            label="পরিচিত স্থান (ঐচ্ছিক)"
            placeholder="মসজিদ / বাজার / স্কুলের কাছে..."
            {...register("landmark")}
          />
        </>
      )}
    </div>
  );
};

// ─── Main Signup ──────────────────────────────────────────────────────────────
const Signup = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isStudent, setIsStudent] = useState<boolean | null>(null);
  const [staffPhone, setStaffPhone] = useState<string | null>(null);
  const [staffInfo, setStaffInfo] = useState<PhoneCheckResult | null>(null);

  const [gender, setGender] = useState<Gender>(null);
  const [religion, setReligion] = useState<Religion>(null);
  const [dobDisplay, setDobDisplay] = useState("");
  const [dobIso, setDobIso] = useState("");
  const [permanentSame, setPermanentSame] = useState<boolean | null>(null);
  const [educationComplete, setEducationComplete] = useState<boolean | null>(
    null,
  );
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");

  const [pDivision, setPDivision] = useState("");
  const [pDistrict, setPDistrict] = useState("");
  const [pThana, setPThana] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<SignupForm>({ mode: "onChange" });

  const fs = useCallback(
    (name: keyof SignupForm): FieldState =>
      getFieldState(name, errors, touchedFields, watch(name)),
    [errors, touchedFields, watch],
  );

  const needsSubject = CLASSES_WITH_SUBJECT.includes(selectedClass);

  const steps = useMemo<string[]>(() => {
    const s: string[] = ["who"];
    if (isStudent === false) {
      s.push(
        "staff-phone-check",
        "parents-name",
        "dob-gender",
        "religion",
        "address",
      );
      if (permanentSame === false) s.push("permanent-address");
      s.push("education-q");
      if (educationComplete === true) s.push("degree");
      if (educationComplete === false) s.push("current-year");
      s.push("email", "emergency-contact");
    } else if (isStudent === true) {
      s.push(
        "name",
        "parents-name",
        "dob-gender",
        "religion",
        "phone",
        "address",
      );
      if (permanentSame === false) s.push("permanent-address");
      s.push("student-class");
      if (needsSubject) s.push("student-subject");
      s.push("roll-school", "email", "emergency-contact");
    }
    s.push("avatar", "password");
    return s;
  }, [isStudent, permanentSame, educationComplete, needsSubject]);

  const currentId = steps[stepIndex] ?? "password";

  const goNext = useCallback(() => {
    setDirection(1);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  // FIX 4: helper to convert Bangla digits back to ASCII for API submission
  const toAsciiDigits = (val: string) =>
    val.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));

  const onSubmit = async (data: SignupForm) => {
    if (!dobIso) {
      toast.error("জন্ম তারিখ দিন");
      return;
    }

    try {
      const fd = new FormData();

      if (isStudent) {
        fd.append("name", data.fullName);
        fd.append("role", "student");
        // Convert Bangla digits to ASCII for phone
        fd.append("phone", toAsciiDigits(data.phone));
        fd.append("studentClass", selectedClass);
        if (needsSubject) fd.append("studentSubject", selectedSubject);
        if (data.roll) fd.append("roll", toAsciiDigits(data.roll));
        if (data.schoolName) fd.append("schoolName", data.schoolName);
        if (data.email) fd.append("email", data.email);
      } else {
        fd.append("role", staffInfo!.role);
        fd.append("phone", staffPhone!);
        fd.append("educationComplete", String(educationComplete));
        if (data.qualification) fd.append("qualification", data.qualification);
        if (educationComplete === true && data.degree)
          fd.append("degree", data.degree);
        if (educationComplete === false && data.currentYear)
          fd.append("currentYear", data.currentYear);
        if (data.email) fd.append("email", data.email);
      }

      fd.append("fatherName", data.fatherName);
      fd.append("motherName", data.motherName);
      fd.append("gender", gender ?? "");
      fd.append("dateOfBirth", dobIso);
      fd.append("religion", religion ?? "");
      fd.append("password", data.password);
      if (data.emergencyContact)
        fd.append("emergencyContact", toAsciiDigits(data.emergencyContact));

      fd.append("gramNam", data.gramNam);
      if (data.para) fd.append("para", data.para);
      fd.append("division", division);
      fd.append("district", district);
      fd.append("thana", thana);
      if (data.landmark) fd.append("landmark", data.landmark);
      fd.append("permanentSameAsPresent", String(permanentSame ?? true));

      if (permanentSame === false) {
        fd.append("permanentGramNam", data.permanentGramNam ?? "");
        if (data.permanentPara) fd.append("permanentPara", data.permanentPara);
        fd.append("permanentDivision", pDivision);
        fd.append("permanentDistrict", pDistrict);
        fd.append("permanentThana", pThana);
      }

      if (avatarFile) fd.append("avatar", avatarFile);

      const { data: res } = await axiosPublic.post<{
        success: boolean;
        token: string;
        user: AuthUser;
      }>("/api/auth/signup", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      localStorage.setItem(TOKEN_KEY, res.token);
      setUser(res.user);
      toast.success("অ্যাকাউন্ট তৈরি হয়েছে! 🎉");
      navigate("/");
    } catch (err: unknown) {
      toast.error(getApiMessage(err, "কিছু একটা সমস্যা হয়েছে"));
    }
  };

  // ADD BEFORE IT:

  // ─── Enter key → next step ────────────────────────────────────────────────
  // Holds the "go next" action for the current step so the keydown handler
  // always calls the latest version without stale closure issues.
  const nextActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if focus is on a textarea or the user is composing (IME)
      if (e.isComposing) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA") return;
      // Only fire on Enter, not Shift+Enter
      if (e.key !== "Enter" || e.shiftKey) return;
      // Don't hijack submit buttons — let the form handle it naturally
      const active = document.activeElement as HTMLElement | null;
      if (active?.getAttribute("type") === "submit") return;

      e.preventDefault();
      nextActionRef.current?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /**
   * Call this at the top of every step's JSX to register what "Enter" should do.
   * Returns nothing — it's only a side-effect registration helper.
   */
  const setNextAction = (fn: () => void) => {
    nextActionRef.current = fn;
  };

  // ─────────────────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentId) {
      case "who":
        setNextAction(() => {
          if (isStudent !== null) goNext();
        });
        return (
          <StepShell title="আপনি রয়েল একাডেমিতে কোন পরিচয়ে যুক্ত?">
            <div className="space-y-2.5">
              <CardBtn
                selected={isStudent === true}
                onClick={() => setIsStudent(true)}
              >
                🎒 আমি ছাত্র/ছাত্রী
              </CardBtn>
              <CardBtn
                selected={isStudent === false}
                onClick={() => setIsStudent(false)}
              >
                📚 আমি শিক্ষক/কর্মী
              </CardBtn>
            </div>
            <div className="flex justify-end mt-6">
              <PrimaryBtn disabled={isStudent === null} onClick={goNext}>
                পরবর্তী <ChevronRight size={15} />
              </PrimaryBtn>
            </div>
          </StepShell>
        );

      case "staff-phone-check":
        return (
          <StaffPhoneCheck
            onBack={goBack}
            onVerified={(phone, info) => {
              setStaffPhone(phone);
              setStaffInfo(info);
              goNext();
            }}
          />
        );

      case "name":
        setNextAction(async () => {
          if (await trigger("fullName")) goNext();
        });
        return (
          <StepShell
            title="আপনার পূর্ণ নাম কী?"
            subtitle="সনদে যেভাবে থাকবে — বাংলায় লিখুন"
          >
            <ValidatedInput
              autoFocus
              state={fs("fullName")}
              iconLeft={User}
              placeholder="পূর্ণ নাম বাংলায় লিখুন"
              error={errors.fullName?.message}
              {...register("fullName", {
                required: "নাম লিখুন",
                minLength: { value: 3, message: "কমপক্ষে ৩ অক্ষর" },
                validate: banglaOnly("নাম"),
              })}
            />
            <NavRow
              onBack={goBack}
              onNext={async () => {
                if (await trigger("fullName")) goNext();
              }}
            />
          </StepShell>
        );

      case "parents-name":
        setNextAction(async () => {
          if (await trigger(["fatherName", "motherName"])) goNext();
        });
        return (
          <StepShell title="অভিভাবকের নাম লিখুন" subtitle="বাংলায় লিখুন">
            {!isStudent && staffInfo && (
              <div
                className="mb-4 px-4 py-2.5 rounded-xl text-sm bangla"
                style={{
                  backgroundColor: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.2)",
                  color: "var(--color-text)",
                }}
              >
                ✅ অ্যাকাউন্ট পাওয়া গেছে:{" "}
                <span className="font-bold text-blue-500">
                  {staffInfo.name}
                </span>
              </div>
            )}
            <div className="space-y-3">
              <ValidatedInput
                autoFocus
                state={fs("fatherName")}
                iconLeft={User}
                label="বাবার নাম *"
                placeholder="বাবার পূর্ণ নাম বাংলায়"
                error={errors.fatherName?.message}
                {...register("fatherName", {
                  required: "বাবার নাম লিখুন",
                  minLength: { value: 3, message: "কমপক্ষে ৩ অক্ষর" },
                  validate: banglaOnly("বাবার নাম"),
                })}
              />
              <ValidatedInput
                state={fs("motherName")}
                iconLeft={User}
                label="মায়ের নাম *"
                placeholder="মায়ের পূর্ণ নাম বাংলায়"
                error={errors.motherName?.message}
                {...register("motherName", {
                  required: "মায়ের নাম লিখুন",
                  minLength: { value: 3, message: "কমপক্ষে ৩ অক্ষর" },
                  validate: banglaOnly("মায়ের নাম"),
                })}
              />
            </div>
            <NavRow
              onBack={goBack}
              onNext={async () => {
                if (await trigger(["fatherName", "motherName"])) goNext();
              }}
            />
          </StepShell>
        );

      case "dob-gender": {
        setNextAction(() => {
          if (dobIso && gender !== null) goNext();
        });
        const genderOpts = isStudent
          ? [
              { v: "ছেলে" as Gender, icon: "👦" },
              { v: "মেয়ে" as Gender, icon: "👧" },
            ]
          : [
              { v: "পুরুষ" as Gender, icon: "👨" },
              { v: "নারী" as Gender, icon: "👩" },
            ];

        return (
          <StepShell title="জন্ম তারিখ ও লিঙ্গ" subtitle="সঠিক তথ্য দিন">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold mb-1.5 bangla text-[var(--color-gray)]">
                  জন্ম তারিখ *
                </p>
                <DatePicker
                  value={dobDisplay}
                  onChange={setDobDisplay}
                  onDateChange={(date) => {
                    if (!isNaN(date.getTime())) setDobIso(toLocalIso(date));
                  }}
                  placeholder="জন্ম তারিখ বেছে নিন"
                  maxDate={new Date()}
                />
                {!dobIso && (
                  <p className="text-[var(--color-gray)] text-xs mt-1.5 bangla">
                    ক্যালেন্ডার খুলে বছর → মাস → তারিখ বেছে নিন
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold mb-2 bangla text-[var(--color-gray)]">
                  {isStudent ? "ছেলে নাকি মেয়ে? *" : "লিঙ্গ *"}
                </p>
                {/* FIX 3: 2 cols always fine for gender (only 2 options) */}
                <div className="grid grid-cols-2 gap-3">
                  {genderOpts.map((o) => (
                    <GenderBtn
                      key={o.v ?? ""}
                      selected={gender === o.v}
                      onClick={() => setGender(o.v)}
                      icon={o.icon}
                      label={o.v ?? ""}
                    />
                  ))}
                </div>
              </div>
            </div>
            <NavRow
              onBack={goBack}
              disabled={!dobIso || gender === null}
              onNext={goNext}
            />
          </StepShell>
        );
      }

      case "religion":
        setNextAction(() => {
          if (religion !== null) goNext();
        });
        return (
          <StepShell title="আপনার ধর্ম কী?">
            {/* FIX 3: 1 col on mobile, 2 on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {RELIGIONS.map((r) => (
                <ReligionBtn
                  key={r.value}
                  selected={religion === r.value}
                  onClick={() => setReligion(r.value as Religion)}
                  icon={r.icon}
                  label={r.value}
                />
              ))}
            </div>
            <NavRow
              onBack={goBack}
              disabled={religion === null}
              onNext={goNext}
            />
          </StepShell>
        );

      case "phone":
        setNextAction(async () => {
          if (await trigger("phone")) goNext();
        });
        return (
          <StepShell
            title="আপনার ফোন নম্বর?"
            subtitle="লগইন করতে এই নম্বর লাগবে"
          >
            {/* FIX 4: numericOnly for Bangla digit display */}
            <ValidatedInput
              autoFocus
              type="tel"
              numericOnly
              state={fs("phone")}
              iconLeft={Phone}
              placeholder="০১XXXXXXXXX"
              error={errors.phone?.message}
              {...register("phone", {
                required: "ফোন নম্বর লিখুন",
                validate: (v) => {
                  // validate by converting to ASCII first
                  const ascii = v.replace(/[০-৯]/g, (d) =>
                    String("০১২৩৪৫৬৭৮৯".indexOf(d)),
                  );
                  return (
                    /^01[3-9]\d{8}$/.test(ascii) ||
                    "সঠিক বাংলাদেশি নম্বর দিন (০১XXXXXXXXX)"
                  );
                },
              })}
            />
            <NavRow
              onBack={goBack}
              onNext={async () => {
                if (await trigger("phone")) goNext();
              }}
            />
          </StepShell>
        );

      case "address":
        setNextAction(async () => {
          const ok = await trigger(["gramNam"]);
          if (ok && permanentSame !== null && division && district && thana)
            goNext();
        });
        return (
          <StepShell
            title="বর্তমান ঠিকানা দিন"
            subtitle="বিভাগ → জেলা → থানা ক্রমে বেছে নিন"
          >
            <GeoAddressFields
              register={register}
              errors={errors}
              fs={fs}
              division={division}
              setDivision={setDivision}
              district={district}
              setDistrict={setDistrict}
              thana={thana}
              setThana={setThana}
              showLandmark
              permanentSame={permanentSame}
              setPermanentSame={setPermanentSame}
            />
            <NavRow
              onBack={goBack}
              disabled={
                permanentSame === null || !division || !district || !thana
              }
              onNext={async () => {
                const ok = await trigger(["gramNam"]);
                if (
                  ok &&
                  permanentSame !== null &&
                  division &&
                  district &&
                  thana
                )
                  goNext();
              }}
            />
          </StepShell>
        );

      case "permanent-address":
        setNextAction(async () => {
          const ok = await trigger(["permanentGramNam"]);
          if (ok && pDivision && pDistrict && pThana) goNext();
        });
        return (
          <StepShell
            title="স্থায়ী ঠিকানা দিন"
            subtitle="মূল বাড়ির ঠিকানা — বিভাগ → জেলা → থানা"
          >
            <GeoAddressFields
              prefix="permanent"
              register={register}
              errors={errors}
              fs={fs}
              division={pDivision}
              setDivision={setPDivision}
              district={pDistrict}
              setDistrict={setPDistrict}
              thana={pThana}
              setThana={setPThana}
            />
            <NavRow
              onBack={goBack}
              disabled={!pDivision || !pDistrict || !pThana}
              onNext={async () => {
                const ok = await trigger(["permanentGramNam"]);
                if (ok && pDivision && pDistrict && pThana) goNext();
              }}
            />
          </StepShell>
        );

      case "student-class":
        setNextAction(() => {
          if (selectedClass) goNext();
        });
        return (
          <StepShell title="আপনি কোন শ্রেণিতে পড়েন?">
            {/* FIX 3: 1 col on mobile, 2 col on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CLASSES.map((cls) => (
                <GridBtn
                  key={cls}
                  selected={selectedClass === cls}
                  onClick={() => {
                    setSelectedClass(cls);
                    if (!CLASSES_WITH_SUBJECT.includes(cls))
                      setSelectedSubject("");
                  }}
                >
                  🎓 {cls}
                </GridBtn>
              ))}
            </div>
            <NavRow onBack={goBack} disabled={!selectedClass} onNext={goNext} />
          </StepShell>
        );

      case "student-subject":
        setNextAction(() => {
          if (selectedSubject) goNext();
        });
        return (
          <StepShell
            title="আপনার বিভাগ কোনটি?"
            subtitle={`${selectedClass} — বিভাগ নির্বাচন করুন`}
          >
            <div className="space-y-2.5">
              {SUBJECTS.map((s) => (
                <CardBtn
                  key={s.value}
                  selected={selectedSubject === s.value}
                  onClick={() => setSelectedSubject(s.value)}
                >
                  {s.icon} {s.value}
                </CardBtn>
              ))}
            </div>
            <NavRow
              onBack={goBack}
              disabled={!selectedSubject}
              onNext={goNext}
            />
          </StepShell>
        );

      case "roll-school":
        setNextAction(() => goNext());
        return (
          <StepShell
            title="বিদ্যালয়ের তথ্য"
            subtitle="ঐচ্ছিক — পরেও দেওয়া যাবে"
          >
            <div className="space-y-3">
              {/* FIX 4: roll number → numericOnly Bangla digits */}
              <ValidatedInput
                numericOnly
                state={fs("roll")}
                iconLeft={Hash}
                label="রোল নম্বর"
                placeholder="আপনার রোল নম্বর"
                {...register("roll")}
              />
              <ValidatedInput
                state={fs("schoolName")}
                iconLeft={School}
                label="বিদ্যালয়ের নাম"
                placeholder="বিদ্যালয়ের পূর্ণ নাম বাংলায়"
                {...register("schoolName")}
              />
            </div>
            <NavRow onBack={goBack} onNext={goNext} />
          </StepShell>
        );

      case "education-q":
        setNextAction(() => {
          if (educationComplete !== null) goNext();
        });
        return (
          <StepShell title="আপনার পড়াশোনা কি শেষ হয়েছে?">
            <div className="space-y-2.5">
              <CardBtn
                selected={educationComplete === true}
                onClick={() => setEducationComplete(true)}
              >
                ✅ হ্যাঁ, পড়াশোনা সম্পন্ন
              </CardBtn>
              <CardBtn
                selected={educationComplete === false}
                onClick={() => setEducationComplete(false)}
              >
                📚 না, এখনও পড়ছি
              </CardBtn>
            </div>
            <NavRow
              onBack={goBack}
              disabled={educationComplete === null}
              onNext={goNext}
            />
          </StepShell>
        );

      case "degree": {
        setNextAction(async () => {
          if (await trigger("degree")) goNext();
        });
        const sel = watch("degree");
        return (
          <StepShell title="আপনার সর্বোচ্চ ডিগ্রি কী?">
            <div className="space-y-3">
              <ValidatedInput
                state={fs("qualification")}
                iconLeft={BookOpen}
                label="যোগ্যতা / বিষয় (যেমন: B.Ed, BCS)"
                placeholder="যোগ্যতার বিবরণ"
                {...register("qualification")}
              />
              <div className="space-y-2">
                {DEGREES.map((d) => (
                  <CardBtn
                    key={d.value}
                    selected={sel === d.value}
                    onClick={() =>
                      setValue("degree", d.value, { shouldValidate: true })
                    }
                  >
                    {d.icon} {d.label}
                  </CardBtn>
                ))}
              </div>
              <input
                type="hidden"
                {...register("degree", { required: "ডিগ্রি নির্বাচন করুন" })}
              />
              <ValidationMsg message={errors.degree?.message} />
            </div>
            <NavRow
              onBack={goBack}
              onNext={async () => {
                if (await trigger("degree")) goNext();
              }}
            />
          </StepShell>
        );
      }

      case "current-year": {
        setNextAction(async () => {
          if (await trigger("currentYear")) goNext();
        });
        const sel = watch("currentYear");
        return (
          <StepShell title="বর্তমানে কোন বর্ষে পড়ছেন?">
            <div className="space-y-3">
              <ValidatedInput
                state={fs("qualification")}
                iconLeft={BookOpen}
                label="পড়ার বিষয় / প্রতিষ্ঠান"
                placeholder="যেমন: ঢাকা বিশ্ববিদ্যালয়, বাংলা বিভাগ"
                {...register("qualification")}
              />
              {/* FIX 3: 1 col on mobile, 2 col on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {YEARS.map((y) => (
                  <GridBtn
                    key={y.value}
                    selected={sel === y.value}
                    onClick={() =>
                      setValue("currentYear", y.value, { shouldValidate: true })
                    }
                  >
                    📖 {y.label}
                  </GridBtn>
                ))}
              </div>
              <input
                type="hidden"
                {...register("currentYear", { required: "বর্ষ নির্বাচন করুন" })}
              />
              <ValidationMsg message={errors.currentYear?.message} />
            </div>
            <NavRow
              onBack={goBack}
              onNext={async () => {
                if (await trigger("currentYear")) goNext();
              }}
            />
          </StepShell>
        );
      }

      case "email":
        setNextAction(async () => {
          const ok = await trigger("email");
          if (ok) goNext();
        });
        return (
          <StepShell title="ইমেইল ঠিকানা" subtitle="ঐচ্ছিক — পরেও দেওয়া যাবে">
            <ValidatedInput
              autoFocus
              type="email"
              banglaDigits={false}
              state={fs("email")}
              iconLeft={Mail}
              placeholder="example@email.com"
              error={errors.email?.message}
              {...register("email", {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "সঠিক ইমেইল ঠিকানা দিন",
                },
              })}
            />
            <NavRow
              onBack={goBack}
              onNext={async () => {
                const ok = await trigger("email");
                if (ok) goNext();
              }}
            />
          </StepShell>
        );

      // REPLACE WITH:
      case "emergency-contact":
        setNextAction(async () => {
          if (await trigger("emergencyContact")) goNext();
        });
        return (
          <StepShell
            title="জরুরি যোগাযোগ নম্বর"
            subtitle="অভিভাবক বা নিকটজনের বাংলাদেশি মোবাইল নম্বর"
          >
            <ValidatedInput
              autoFocus
              type="tel"
              numericOnly
              state={fs("emergencyContact")}
              iconLeft={PhoneCall}
              placeholder="০১XXXXXXXXX"
              error={errors.emergencyContact?.message}
              {...register("emergencyContact", {
                required: "জরুরি যোগাযোগ নম্বর দিন",
                validate: (v) => {
                  const ascii = v.replace(/[০-৯]/g, (d) =>
                    String("০১২৩৪৫৬৭৮৯".indexOf(d)),
                  );
                  return (
                    /^01[3-9]\d{8}$/.test(ascii) ||
                    "সঠিক বাংলাদেশি নম্বর দিন (০১৩–০১৯ দিয়ে শুরু, ১১ সংখ্যা)"
                  );
                },
              })}
            />
            <NavRow
              onBack={goBack}
              onNext={async () => {
                if (await trigger("emergencyContact")) goNext();
              }}
            />
          </StepShell>
        );

      case "avatar":
        setNextAction(() => goNext());
        return (
          <StepShell
            title="প্রোফাইল ছবি দিন"
            subtitle="ঐচ্ছিক — পরেও দেওয়া যাবে"
          >
            <AvatarPicker
              gender={gender}
              preview={avatarPreview}
              onChange={(f) => {
                setAvatarFile(f);
                setAvatarPreview(URL.createObjectURL(f));
              }}
              onRemove={() => {
                setAvatarFile(null);
                setAvatarPreview(null);
              }}
            />
            <div className="flex justify-between mt-6">
              <SecondaryBtn onClick={goBack}>
                <ChevronLeft size={15} /> পেছনে
              </SecondaryBtn>
              <div className="flex gap-2">
                <SecondaryBtn onClick={goNext}>এড়িয়ে যান</SecondaryBtn>
                {avatarPreview && (
                  <PrimaryBtn onClick={goNext}>
                    পরবর্তী <ChevronRight size={15} />
                  </PrimaryBtn>
                )}
              </div>
            </div>
          </StepShell>
        );

      case "password":
        return (
          <StepShell title="পাসওয়ার্ড তৈরি করুন" subtitle="কমপক্ষে ৬টি অক্ষর">
            <form onSubmit={handleSubmit(onSubmit)}>
              <PasswordInput
                autoFocus
                state={fs("password")}
                iconLeft={Lock}
                showPassword={showPw}
                onToggle={() => setShowPw((p) => !p)}
                EyeIcon={Eye}
                EyeOffIcon={EyeOff}
                placeholder="পাসওয়ার্ড লিখুন"
                error={errors.password?.message}
                {...register("password", {
                  required: "পাসওয়ার্ড লিখুন",
                  minLength: { value: 6, message: "কমপক্ষে ৬টি অক্ষর" },
                })}
              />
              <SummaryBox
                rows={[
                  {
                    label: "ভূমিকা",
                    value: isStudent
                      ? "ছাত্র/ছাত্রী"
                      : staffInfo?.role === "teacher"
                        ? "শিক্ষক"
                        : staffInfo?.role === "principal"
                          ? "অধ্যক্ষ"
                          : "প্রশাসক",
                  },
                  {
                    label: "নাম",
                    value: isStudent
                      ? watch("fullName") || "—"
                      : (staffInfo?.name ?? "—"),
                  },
                  {
                    label: "ফোন",
                    value: isStudent
                      ? watch("phone") || "—"
                      : (staffPhone ?? "—"),
                  },
                  { label: "জন্ম তারিখ", value: dobDisplay || "—" },
                  { label: "বিভাগ", value: division || "—" },
                  { label: "জেলা", value: district || "—" },
                  { label: "থানা", value: thana || "—" },
                  { label: "লিঙ্গ", value: gender || "—" },
                  { label: "ধর্ম", value: religion || "—" },
                  ...(isStudent && selectedClass
                    ? [{ label: "শ্রেণি", value: selectedClass }]
                    : []),
                  ...(isStudent && needsSubject && selectedSubject
                    ? [{ label: "বিভাগ", value: selectedSubject }]
                    : []),
                ]}
              />
              <div className="flex justify-between mt-5">
                <SecondaryBtn onClick={goBack}>
                  <ChevronLeft size={15} /> পেছনে
                </SecondaryBtn>
                <SubmitBtn disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                      অপেক্ষা করুন...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} /> অ্যাকাউন্ট খুলুন
                    </>
                  )}
                </SubmitBtn>
              </div>
            </form>
          </StepShell>
        );

      default:
        return null;
    }
  };

  return (
    <PageShell
      stepIndex={stepIndex}
      totalSteps={steps.length}
      footer={
        <p className="text-center text-sm bangla text-[var(--color-gray)]">
          ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
          <Link
            to="/login"
            className="font-semibold hover:underline text-blue-500"
          >
            লগইন করুন
          </Link>
        </p>
      }
    >
      <div
        className="pt-6 pb-4 text-center -mx-4 sm:-mx-8 px-4 sm:px-8 mb-1"
        style={{ borderBottom: "1px solid var(--color-active-border)" }}
      >
        <Link to="/">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-2.5"
            style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}
          >
            <GraduationCap className="w-6 h-6 text-white" />
          </motion.div>
        </Link>
        <h2 className="text-lg font-bold bangla text-[var(--color-text)]">
          রয়েল একাডেমি
        </h2>
        <p className="text-xs bangla mt-0.5 text-[var(--color-gray)]">
          নতুন অ্যাকাউন্ট তৈরি করুন
        </p>
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentId}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={slideTrans}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </PageShell>
  );
};

export default Signup;
