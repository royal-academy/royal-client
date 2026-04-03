// src/pages/Admin/Dashboard/Sidebar.Ui.tsx

import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring as useMotionSpring,
  type Variants,
  type Transition,
} from "framer-motion";
import { LogOut, ChevronDown, HomeIcon, UserIcon } from "lucide-react";
import type {
  NavItem,
  SidebarContentProps,
} from "../../../utility/AdminSidebarData";
import Avatar from "../../../components/common/Avatar";

// ── Motion constants ──────────────────────────────────────────────────────────
export const SPRING: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 28,
};
export const SPRING_SM: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 32,
};

export const sidebarV: Variants = {
  hidden: { x: -40, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { ...SPRING, staggerChildren: 0.06 } as Transition,
  },
};
export const cardV: Variants = {
  hidden: { y: -16, opacity: 0, scale: 0.96 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { ...SPRING, delay: 0.05 } as Transition,
  },
};
export const labelV: Variants = {
  hidden: { x: -12, opacity: 0 },
  visible: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: { delay: 0.15 + i * 0.07, ...SPRING } as Transition,
  }),
};
export const groupV: Variants = {
  hidden: { x: -14, opacity: 0 },
  visible: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: { delay: 0.2 + i * 0.08, ...SPRING } as Transition,
  }),
};
export const subItemV: Variants = {
  hidden: { x: -10, opacity: 0 },
  visible: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: { delay: i * 0.045, ...SPRING } as Transition,
  }),
  exit: {
    x: -6,
    opacity: 0,
    transition: { duration: 0.12, ease: "easeIn" as const } as Transition,
  },
};

// ── MagneticWrap ──────────────────────────────────────────────────────────────
export const MagneticWrap = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useMotionSpring(x, { stiffness: 420, damping: 32 });
  const sy = useMotionSpring(y, { stiffness: 420, damping: 32 });
  return (
    <motion.div
      className={className}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        x.set(((e.clientX - r.left) / r.width - 0.5) * 8);
        y.set(((e.clientY - r.top) / r.height - 0.5) * 8);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.div>
  );
};

// ── Tooltip ───────────────────────────────────────────────────────────────────
const PlainTooltip = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="relative group w-full">
    {children}
    <div
      className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50
      hidden group-hover:block px-2 py-1 rounded bg-[var(--color-text)] text-[var(--color-bg)]
      text-xs whitespace-nowrap shadow-lg"
    >
      {label}
    </div>
  </div>
);

// ── DirectLink (for items without subItems) ───────────────────────────────────
const DirectLink = ({
  item,
  onNavClick,
}: {
  item: NavItem;
  onNavClick?: () => void;
}) => {
  const { pathname } = useLocation();
  const active = pathname === item.path;
  const Icon = item.icon;

  return (
    <PlainTooltip label={item.name}>
      <motion.div
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.97 }}
        transition={SPRING_SM}
      >
        <Link
          to={item.path!}
          onClick={onNavClick}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${
              active
                ? "bg-[var(--color-active-bg)] text-[var(--color-active-text)] font-semibold"
                : "text-[var(--color-gray)] hover:text-[var(--color-text)] hover:bg-[var(--color-active-bg)]"
            }`}
        >
          <motion.span
            whileHover={{ rotate: 12, scale: 1.2 }}
            transition={SPRING_SM}
          >
            <Icon className="w-4 h-4 shrink-0" />
          </motion.span>
          <span className="truncate">{item.name}</span>
          {active && (
            <motion.span
              layoutId="activeIndicator"
              className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-active-text)]"
              transition={SPRING}
            />
          )}
        </Link>
      </motion.div>
    </PlainTooltip>
  );
};

// ── NavGroup ──────────────────────────────────────────────────────────────────
export const NavGroup = ({
  item,
  open,
  onToggle,
  onNavClick,
}: {
  item: NavItem;
  open: boolean;
  onToggle: () => void;
  onNavClick?: () => void;
}) => {
  const { pathname } = useLocation();
  const isActive = (p: string) => pathname === p;

  // If item has no subItems, render as a direct link
  if (!item.subItems || item.subItems.length === 0) {
    return <DirectLink item={item} onNavClick={onNavClick} />;
  }

  const groupActive = item.subItems.some((s) => isActive(s.path));
  const Icon = item.icon;

  return (
    <div className="mt-1">
      <motion.button
        type="button"
        onClick={onToggle}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        transition={SPRING_SM}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium
          cursor-pointer transition-colors
          ${
            groupActive
              ? "bg-[var(--color-active-bg)] text-[var(--color-active-text)] font-semibold"
              : "text-[var(--color-gray)] hover:text-[var(--color-text)] bg-[var(--color-bg)]"
          }`}
      >
        <span className="flex items-center gap-3">
          <motion.span
            animate={
              open
                ? { rotate: [0, -15, 15, 0], scale: [1, 1.25, 1] }
                : { rotate: 0, scale: 1 }
            }
            transition={{ duration: 0.4 }}
          >
            <Icon className="w-4 h-4 shrink-0" />
          </motion.span>
          {item.name}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 32,
            duration: 0.25,
          }}
        >
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="sub"
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: { ...SPRING } as Transition,
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                duration: 0.18,
                ease: "easeIn" as const,
              } as Transition,
            }}
            className="overflow-hidden"
          >
            <div className="pl-3 mt-0.5 space-y-0.5 border-l border-[var(--color-active-bg)] ml-[22px]">
              {item.subItems.map((sub, i) => {
                const SubIcon = sub.icon;
                const active = isActive(sub.path);
                return (
                  <PlainTooltip key={sub.path} label={sub.name}>
                    <motion.div
                      custom={i}
                      variants={subItemV}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.97 }}
                      transition={SPRING_SM}
                    >
                      <Link
                        to={sub.path}
                        onClick={onNavClick}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors
                          ${
                            active
                              ? "bg-[var(--color-active-bg)] text-[var(--color-active-text)] font-medium"
                              : "text-[var(--color-gray)] hover:text-[var(--color-text)] hover:bg-[var(--color-active-bg)]"
                          }`}
                      >
                        <motion.span
                          whileHover={{ rotate: 12, scale: 1.2 }}
                          transition={SPRING_SM}
                        >
                          <SubIcon className="w-3.5 h-3.5 shrink-0" />
                        </motion.span>
                        <span className="truncate">{sub.name}</span>
                        {active && (
                          <motion.span
                            layoutId="activeIndicator"
                            className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-active-text)]"
                            transition={SPRING}
                          />
                        )}
                      </Link>
                    </motion.div>
                  </PlainTooltip>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── SidebarContent ────────────────────────────────────────────────────────────
export const SidebarContent = ({
  user,
  navGroups,

  roleConfig: cfg,
  onLogout,
  onThemeToggle,
  onNavClick,
}: SidebarContentProps) => {
  const [openGroup, setOpenGroup] = useState<number | null>(null);
  const avatarUrl = user?.avatar?.url;

  return (
    <motion.div
      className="flex flex-col h-full bg-[var(--color-bg)]"
      variants={sidebarV}
      initial="hidden"
      animate="visible"
    >
      {/* User card */}
      <motion.div
        variants={cardV}
        className="p-5 border-b border-[var(--color-active-border)] space-y-2.5"
      >
        <motion.div
          className="flex flex-col items-center gap-2.5 px-1 py-1.5 rounded-xl bg-[var(--color-bg)]"
          whileHover={{ scale: 1.015 }}
          transition={SPRING_SM}
        >
          {/* Avatar: সব ক্ষেত্রেই নতুন Avatar component */}
          <Avatar
            url={avatarUrl ?? null}
            fallbackIcon={<UserIcon className="w-6 h-6" />}
            name={user?.name ?? "U"}
            color={cfg.color}
            size={112}
            radius={56}
            onClick={onThemeToggle}
          />

          <Link
            to="/dashboard/profile"
            onClick={onNavClick}
            className="min-w-0 text-center"
          >
            <motion.p
              className="text-xl font-semibold text-[var(--color-text)] truncate bangla"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18, ...SPRING } as Transition}
            >
              {user?.name ?? "User"}
            </motion.p>
            <motion.div
              className="flex justify-center items-center gap-1.5 mt-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.26 }}
            >
              <span
                className="text-sm px-1.5 py-0 font-bold uppercase tracking-wide rounded-full border h-4 inline-flex items-center bangla"
                style={{
                  backgroundColor: cfg.color + "18",
                  color: cfg.color,
                  borderColor: cfg.color + "44",
                }}
              >
                {cfg.label}
              </span>
              <span className="text-[10px] text-[var(--color-gray)] opacity-50 font-mono">
                ID:#{user?.slug ?? "—"}
              </span>
            </motion.div>
          </Link>
        </motion.div>

        {/* Home + Logout */}
        <div className="flex gap-1.5">
          <MagneticWrap className="flex-1">
            <Link
              to="/"
              onClick={onNavClick}
              className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-lg
                text-xs font-semibold border transition-colors
                text-emerald-700 dark:text-emerald-400
                bg-emerald-50 dark:bg-emerald-950/30
                hover:bg-emerald-100 dark:hover:bg-emerald-900/40
                border-emerald-200/80 dark:border-emerald-800/40"
            >
              <motion.span
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <HomeIcon className="w-3 h-3" />
              </motion.span>
              হোম
            </Link>
          </MagneticWrap>

          <MagneticWrap className="flex-1">
            <motion.button
              type="button"
              onClick={() => {
                onLogout();
                onNavClick?.();
              }}
              whileTap={{ x: [0, -4, 4, 0] } as never}
              className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-lg
                text-xs font-semibold border transition-colors cursor-pointer
                text-red-600 dark:text-red-400
                bg-red-50 dark:bg-red-950/20
                hover:bg-red-100 dark:hover:bg-red-900/30
                border-red-200/80 dark:border-red-800/40"
            >
              <motion.span whileHover={{ x: 3 }} transition={SPRING_SM}>
                <LogOut className="w-3 h-3" />
              </motion.span>
              লগ আউট
            </motion.button>
          </MagneticWrap>
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <nav className="space-y-0.5">
          {navGroups.map((group, idx) => (
            <div key={group.name + idx}>
              {idx > 0 && (
                <motion.hr
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="my-2 border-[var(--color-active-border)]"
                />
              )}

              <motion.div
                custom={idx}
                variants={groupV}
                initial="hidden"
                animate="visible"
              >
                <NavGroup
                  item={group}
                  open={openGroup === idx}
                  onToggle={() => setOpenGroup((p) => (p === idx ? null : idx))}
                  onNavClick={onNavClick}
                />
              </motion.div>
            </div>
          ))}
        </nav>
      </div>
    </motion.div>
  );
};
