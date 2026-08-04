import { useState, useEffect } from "react";
import { Nav } from "react-bootstrap";
import { useRouter } from "../../helpers/useRouter";
import styles from "../../stylesheets/layout.module.scss";
import Logout from "../auth/Logout";
import { LuLayoutDashboard, LuUsers, LuSettings2, LuLogOut, LuStethoscope, LuClipboardList, LuSalad, LuFlaskConical, LuTicket, LuBrainCircuit, LuCalendarDays, LuReceipt, LuBookOpen, LuChevronDown, LuSparkles, LuTarget, LuHeartPulse, LuAlertCircle, LuUtensilsCrossed, LuStethoscope as LuMedical, LuMailOpen, LuTrendingUp, LuBriefcase, LuUserCheck, LuScrollText } from "react-icons/lu";
import { useLoader } from "../../constants/LoaderContext";
import { getLoggedInUser } from "../../helpers/auth";
import { motion, AnimatePresence } from "framer-motion";

const aiDietSubItems = [
  { href: "/dashboard/ai-diet-plan/health-goals", icon: LuTarget, label: "Health Goals List" },
  { href: "/dashboard/ai-diet-plan/diseases", icon: LuHeartPulse, label: "Medicines List" },
  { href: "/dashboard/ai-diet-plan/food-allergies", icon: LuAlertCircle, label: "Food Allergies List" },
  { href: "/dashboard/ai-diet-plan/cuisines", icon: LuUtensilsCrossed, label: "Cuisine List" },
  { href: "/dashboard/ai-diet-plan/medical-conditions", icon: LuMedical, label: "Medical Conditions List" },
];

const Sidebar = ({ onNavClick }) => {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [aiDietOpen, setAiDietOpen] = useState(false);
  const { setLoading } = useLoader();

  const [adminName, setAdminName] = useState("Admin");
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    // Load from localStorage only on client after mount (avoids SSR mismatch)
    const user = getLoggedInUser();
    setAdminName(user?.name || user?.full_name || user?.firstName || user?.fullName || user?.username || "Admin");
    setProfilePic(user?.profilePicture || null);

    const handleUpdate = (e) => {
      if (e.detail?.name !== undefined) setAdminName(e.detail.name || "Admin");
      if (e.detail?.profilePicture !== undefined) setProfilePic(e.detail.profilePicture || null);
    };
    window.addEventListener("profileUpdated", handleUpdate);
    return () => window.removeEventListener("profileUpdated", handleUpdate);
  }, []);

  const handleClose = () => setShow(false);

  const handleNavClick = (href) => {
    router.push(href);
    if (onNavClick) onNavClick();
  };

  const navItems = [
    { href: "/dashboard", icon: LuLayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/user-management", icon: LuUsers, label: "User Management" },
    { href: "/dashboard/dietitian-requests", icon: LuClipboardList, label: "Dietitian Requests" },
    { href: "/dashboard/dietitian-management", icon: LuStethoscope, label: "Dietitians" },
    { href: "/dashboard/ai-diet-plans", icon: LuBrainCircuit, label: "Diet Chart Requests" },
    { href: "/dashboard/diet-chart-requests", icon: LuSalad, label: "Diet Charts" },
  ];

  const navItemsBottom = [
    { href: "/dashboard/appointments", icon: LuCalendarDays, label: "Appointments" },
    { href: "/dashboard/offline-appointments", icon: LuUserCheck, label: "Offline Appointments" },
    { href: "/dashboard/offline-diet-charts",  icon: LuScrollText, label: "Offline Diet Charts" },
    { href: "/dashboard/course-management", icon: LuBookOpen, label: "Courses" },
    { href: "/dashboard/coupon-management", icon: LuTicket, label: "Coupons" },
    { href: "/dashboard/coupon-redemptions", icon: LuReceipt, label: "Redemptions" },
    { href: "/dashboard/nutrition-config", icon: LuFlaskConical, label: "Nutrition Config" },
    { href: "/dashboard/broadcast-email", icon: LuMailOpen, label: "Broadcast Email" },
    { href: "/dashboard/earnings", icon: LuTrendingUp, label: "Earnings" },
    { href: "/dashboard/career", icon: LuBriefcase, label: "Career" },
    { href: "/dashboard/setting", icon: LuSettings2, label: "Settings" },
  ];

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);
    const handleError = () => setLoading(false);
    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleError);
    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleError);
    };
  }, [router.events, setLoading]);

  const initial = (adminName || "A").charAt(0).toUpperCase();

  return (
    <Nav className={`${styles.sidebarBox} flex-column`}>

      {/* Scrollable nav items — grows to fill available space */}
      <div className={styles.sidebarScrollArea}>
        {/* Nav label */}
        <p className={styles.sidebarNavLabel}>NAVIGATION</p>

        {/* Nav items — top group */}
        {navItems.map((item, idx) => {
          const isActive = item.href === "/dashboard"
            ? router.pathname === "/dashboard"
            : router.pathname === item.href || router.pathname.startsWith(item.href + "/");
          return (
            <motion.div
              key={idx}
              onClick={() => handleNavClick(item.href)}
              className={`${styles.sidebarNavItem} ${isActive ? styles.sidebarNavActive : ""}`}
              whileHover={!isActive ? { x: 4 } : {}}
              transition={{ duration: 0.15 }}
            >
              <div className={`${styles.sidebarNavIcon} ${isActive ? styles.sidebarNavIconActive : ""}`}>
                <item.icon size={18} />
              </div>
              <span className={styles.sidebarNavLabel2}>{item.label}</span>
              {isActive && <div className={styles.sidebarNavPip} />}
            </motion.div>
          );
        })}

        {/* AI Diet Plan — accordion */}
        {(() => {
          const isAnySubActive = aiDietSubItems.some(s => router.pathname === s.href || router.pathname.startsWith(s.href + "/"));
          return (
            <div>
              <motion.div
                onClick={() => setAiDietOpen(o => !o)}
                className={`${styles.sidebarNavItem} ${isAnySubActive ? styles.sidebarNavActive : ""}`}
                whileHover={!isAnySubActive ? { x: 4 } : {}}
                transition={{ duration: 0.15 }}
              >
                <div className={`${styles.sidebarNavIcon} ${isAnySubActive ? styles.sidebarNavIconActive : ""}`}>
                  <LuSparkles size={18} />
                </div>
                <span className={styles.sidebarNavLabel2}>AI Diet Plan</span>
                <motion.div
                  animate={{ rotate: aiDietOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className={styles.sidebarChevron}
                >
                  <LuChevronDown size={15} />
                </motion.div>
              </motion.div>

              <AnimatePresence initial={false}>
                {aiDietOpen && (
                  <motion.div
                    key="ai-diet-sub"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className={styles.sidebarSubGroup}
                  >
                    {aiDietSubItems.map((sub, i) => {
                      const isSubActive = router.pathname === sub.href || router.pathname.startsWith(sub.href + "/");
                      return (
                        <motion.div
                          key={i}
                          onClick={() => handleNavClick(sub.href)}
                          className={`${styles.sidebarSubItem} ${isSubActive ? styles.sidebarSubItemActive : ""}`}
                          whileHover={!isSubActive ? { x: 4 } : {}}
                          transition={{ duration: 0.15 }}
                        >
                          <div className={styles.sidebarSubDot} />
                          <sub.icon size={14} className={styles.sidebarSubIcon} />
                          <span className={styles.sidebarNavLabel2}>{sub.label}</span>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()}

        {/* Nav items — bottom group */}
        {navItemsBottom.map((item, idx) => {
          const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + "/");
          return (
            <motion.div
              key={idx}
              onClick={() => handleNavClick(item.href)}
              className={`${styles.sidebarNavItem} ${isActive ? styles.sidebarNavActive : ""}`}
              whileHover={!isActive ? { x: 4 } : {}}
              transition={{ duration: 0.15 }}
            >
              <div className={`${styles.sidebarNavIcon} ${isActive ? styles.sidebarNavIconActive : ""}`}>
                <item.icon size={18} />
              </div>
              <span className={styles.sidebarNavLabel2}>{item.label}</span>
              {isActive && <div className={styles.sidebarNavPip} />}
            </motion.div>
          );
        })}
      </div>

      {/* Divider — always visible above logout */}
      <div className={styles.sidebarDivider} />

      {/* Logout — pinned at the bottom */}
      <motion.div
        className={styles.sidebarLogout}
        onClick={() => setShow(true)}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.15 }}
      >
        <div className={styles.sidebarLogoutIcon}>
          <LuLogOut size={18} />
        </div>
        <span className={styles.sidebarNavLabel2}>Log Out</span>
      </motion.div>

      <Logout show={show} handleClose={handleClose} />
    </Nav>
  );
};

export default Sidebar;
