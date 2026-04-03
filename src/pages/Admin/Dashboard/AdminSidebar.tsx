// src/pages/Admin/Dashboard/AdminSidebar.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeProvider";
import { SidebarContent } from "./Sidebar.Ui";
import { ROLES } from "../../../utility/Constants";
import {
  contentNav,
  dashboardNav,
  managementNav,
  studentNav,
  type NavItem,
} from "../../../utility/AdminSidebarData";
import Avatar from "../../../components/common/Avatar";

const buildNav = (role: string): NavItem[] => {
  if (role === "student") return studentNav();

  const isPrivileged = ["admin", "principal", "owner"].includes(role);
  return [
    ...dashboardNav(),
    ...contentNav(isPrivileged),
    ...managementNav(isPrivileged),
  ];
};

const AdminSidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const { user, logout } = useAuth();
  const { toggleTheme } = useTheme();

  const role = user?.role ?? "teacher";
  const roleConfig = ROLES[role] ?? ROLES.teacher;
  const navGroups = buildNav(role);

  const contentProps = {
    user,
    navGroups,
    roleConfig,
    onLogout: logout,
    onThemeToggle: toggleTheme,
    onNavClick: () => setMobileOpen(false),
  };

  useEffect(() => {
    const sync = () => {
      const lg = window.innerWidth >= 1024;
      setDesktopOpen(lg);
      if (lg) setMobileOpen(false);
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return (
    <>
      {/* Mobile toggle — ProfileButton খুলবে sidebar */}
      <motion.button
        type="button"
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
        aria-controls="mobile-sidebar"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[60] rounded-xl outline-none cursor-pointer
    px-1.5 py-1 bg-transparent border border-transparent transition-colors
    min-h-11 min-w-11 flex items-center justify-center"
        whileHover={{
          backgroundColor: "var(--color-active-bg)",
          borderColor: "var(--color-active-border)",
        }}
        whileTap={{ scale: 0.96 }}
      >
        <Avatar
          name={user?.name ?? "User"}
          url={user?.avatar?.url ?? null}
          color={roleConfig.color}
          size={40}
        />
      </motion.button>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              className="lg:hidden fixed inset-0 z-[55] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="mobile-sidebar"
              id="mobile-sidebar"
              aria-label="Side navigation"
              className="lg:hidden fixed top-0 bottom-0 left-0 z-[60] w-[280px]
                border-r border-[var(--color-active-border)] bg-[var(--color-bg)]"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <SidebarContent {...contentProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ width: desktopOpen ? 272 : 0, opacity: desktopOpen ? 1 : 0 }}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 28,
          duration: 0.35,
        }}
        className="hidden lg:flex sticky top-0 h-screen border-r border-[var(--color-active-border)]
          bg-[var(--color-bg)] overflow-hidden shrink-0"
        aria-label="Side navigation"
      >
        <div className="w-[272px]">
          <SidebarContent {...contentProps} />
        </div>
      </motion.aside>
    </>
  );
};

export default AdminSidebar;
