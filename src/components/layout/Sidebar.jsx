import { useState, useEffect } from "react";
import { Nav } from "react-bootstrap";
import { useRouter } from "../../helpers/useRouter";
import styles from "../../stylesheets/layout.module.scss";
import Logout from "../auth/Logout";
import { LuLayoutDashboard, LuUsers, LuSettings2, LuLogOut, LuStethoscope, LuClipboardList, LuSalad, LuFlaskConical, LuTicket, LuBrainCircuit } from "react-icons/lu";
import { useLoader } from "../../constants/LoaderContext";
import { getLoggedInUser } from "../../helpers/auth";
import { motion } from "framer-motion";

const Sidebar = ({ onNavClick }) => {
  const router = useRouter();
  const [show, setShow] = useState(false);
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
    { href: "/dashboard/diet-chart-requests", icon: LuSalad, label: "Diet Chart Requests" },
    { href: "/dashboard/ai-diet-plans", icon: LuBrainCircuit, label: "AI Diet Plans" },
    { href: "/dashboard/dietitian-management", icon: LuStethoscope, label: "Dietitians" },
    { href: "/dashboard/nutrition-config", icon: LuFlaskConical, label: "Nutrition Config" },
    { href: "/dashboard/coupon-management", icon: LuTicket, label: "Coupons" },
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

      {/* Nav label */}
      <p className={styles.sidebarNavLabel}>NAVIGATION</p>

      {/* Nav items */}
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

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Divider */}
      <div className={styles.sidebarDivider} />

      {/* Logout */}
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
