import { useEffect, useRef, useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import type { ReactNode } from "react";

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SelectInputProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  isTouched?: boolean;
  className?: string;
}

const SelectInput = ({
  options,
  value,
  onChange,
  onBlur,
  placeholder = "Select option",
  label,
  required,
  disabled,
  error,
  isTouched,
  className = "",
}: SelectInputProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onBlur]);

  const accent = "#6d28d9";

  const borderColor = error
    ? "#f43f5e"
    : isTouched && !error && value
      ? "#34d399"
      : open
        ? accent
        : "var(--color-active-border)";

  const ringColor = error
    ? "#f43f5e30"
    : isTouched && !error && value
      ? "#34d39930"
      : open
        ? `${accent}30`
        : "none";

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold tracking-wide uppercase mb-1.5 bangla text-[var(--color-gray)]">
          {label}
          {required && (
            <span className="text-rose-500 ml-1 normal-case">*</span>
          )}
        </label>
      )}

      <div className="relative" ref={ref}>
        {/* Trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          onBlur={onBlur}
          className="w-full px-4 py-3 rounded-xl text-sm text-left flex items-center justify-between gap-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed bangla transition-all"
          style={{
            backgroundColor: "var(--color-active-bg)",
            border: `1px solid ${borderColor}`,
            color: "var(--color-text)",
            boxShadow:
              open || (isTouched && value) ? `0 0 0 2px ${ringColor}` : "none",
          }}
        >
          <span
            className="flex items-center gap-2 truncate"
            style={{
              color: selected ? "var(--color-text)" : "var(--color-gray)",
            }}
          >
            {selected?.icon && (
              <span className="text-base shrink-0">{selected.icon}</span>
            )}
            {selected ? selected.label : placeholder}
          </span>
          <IoChevronDown
            className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
            style={{ color: "var(--color-gray)" }}
          />
        </button>

        {/* Dropdown */}
        <div
          className={`absolute z-50 w-full mt-1.5 rounded-xl overflow-hidden transition-all duration-200 origin-top ${
            open
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
          }`}
          style={{
            backgroundColor: "var(--color-bg)",
            border: `1px solid ${open ? "var(--color-active-border)" : "transparent"}`,
            boxShadow: "0 15px 60px -10px rgba(0,0,0,0.18)",
          }}
        >
          {options.length === 0 ? (
            <p className="px-4 py-3 text-sm text-center bangla text-[var(--color-gray)]">
              কোনো বিকল্প নেই
            </p>
          ) : (
            <div
              className="overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ maxHeight: "220px" }}
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 bangla transition-colors duration-150"
                  style={
                    opt.value === value
                      ? {
                          backgroundColor: `${accent}15`,
                          color: accent,
                          fontWeight: 600,
                        }
                      : { color: "var(--color-text)" }
                  }
                  onMouseEnter={(e) => {
                    if (opt.value !== value)
                      e.currentTarget.style.backgroundColor =
                        "var(--color-active-bg)";
                  }}
                  onMouseLeave={(e) => {
                    if (opt.value !== value)
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {opt.icon && (
                    <span className="text-base shrink-0">{opt.icon}</span>
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-rose-500 text-xs mt-1 bangla">{error}</p>}
    </div>
  );
};

export default SelectInput;
