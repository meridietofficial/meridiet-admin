// src/components/layout/index.js
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Footer from "../common/Footer";

const Layout = ({ children, sidebarOpen, onClose }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (!mobile && onClose) {
        onClose();
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [onClose]);

  const closeSidebar = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div className="layout-wrapper">
      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <div className={`sidebar-container ${sidebarOpen ? "open" : ""} ${isMobile ? "mobile" : ""}`}>
        <Sidebar onNavClick={closeSidebar} />
      </div>

      {/* Main Content */}
      <div className={`main-content ${isMobile ? "mobile" : ""}`}>
        <div className="content-wrapper">
          <div className="page-content">{children}</div>
          <Footer />
        </div>
      </div>

      <style>{`
        .layout-wrapper {
          display: flex;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        /* Sidebar Container */
        .sidebar-container {
          position: fixed;
          top: 60px;
          left: 0;
          height: calc(100vh - 60px);
          width: 280px;
          background: #ffffff;
          z-index: 100;
          transition: transform 0.3s ease;
          box-shadow: 2px 0 12px 0 rgba(0, 0, 0, 0.1);
          overflow-y: auto;
          overflow-x: hidden;
        }

        .sidebar-container.mobile {
          transform: translateX(-100%);
          z-index: 1039;
        }

        .sidebar-container.mobile.open {
          transform: translateX(0);
        }

        /* Overlay */
        .sidebar-overlay {
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1038;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Main Content */
        .main-content {
          flex: 1;
          margin-left: 280px;
          min-height: calc(100vh - 60px);
          margin-top: 60px;
          background: var(--dash-bg, #F2F5F3);
          transition: margin-left 0.3s ease;
          overflow-x: hidden;
        }

        .main-content.mobile {
          margin-left: 0;
        }

        .content-wrapper {
          padding: 20px;
          min-height: calc(100vh - 60px);
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
        }

        .page-content {
          flex: 1;
        }

        /* Responsive breakpoints */
        @media (max-width: 1199px) {
          .sidebar-container {
            width: 260px;
          }
          .main-content {
            margin-left: 260px;
          }
        }

        @media (max-width: 991px) {
          .sidebar-container {
            width: 280px;
          }
          .main-content {
            margin-left: 0;
          }
          .content-wrapper {
            padding: 15px;
          }
        }

        @media (max-width: 767px) {
          .content-wrapper {
            padding: 10px;
          }
        }

        @media (max-width: 575px) {
          .sidebar-container {
            width: 100%;
            max-width: 280px;
          }
          .content-wrapper {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
