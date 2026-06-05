// src/components/layout/index.js
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Footer from "../common/Footer";
import { HiMenuAlt2 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth >= 992) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="layout-wrapper">
      {/* Mobile Menu Toggle Button */}
      {isMobile && (
        <button
          className="mobile-menu-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <IoClose size={24} /> : <HiMenuAlt2 size={24} />}
        </button>
      )}

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

      <style jsx global>{`
        .layout-wrapper {
          display: flex;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        /* Mobile Menu Toggle Button */
        .mobile-menu-toggle {
          position: fixed;
          top: 100px;
          left: 15px;
          z-index: 1050;
          background: #BE8C69;
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          color: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .mobile-menu-toggle:hover {
          background: #b8941f;
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
          z-index: 1040;
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
          z-index: 1030;
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
            padding-top: 60px;
          }
          .mobile-menu-toggle {
            top: 85px;
          }
        }

        @media (max-width: 767px) {
          .content-wrapper {
            padding: 10px;
            padding-top: 55px;
          }
          .mobile-menu-toggle {
            top: 82px;
            left: 10px;
            padding: 6px 10px;
          }
        }

        @media (max-width: 575px) {
          .sidebar-container {
            width: 100%;
            max-width: 280px;
          }
          .content-wrapper {
            padding: 8px;
            padding-top: 50px;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
