import { useState, useEffect } from "react";
import { Container, Navbar, Image } from "react-bootstrap";
import styles from "../../stylesheets/layout.module.scss";
import { getLoggedInUser } from "../../helpers/auth";
import { HiMenuAlt2 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";

function Header({ onToggle, sidebarOpen }) {
  const [adminName, setAdminName] = useState("Admin");
  const [profilePic, setProfilePic] = useState(null);

  const syncFromStorage = () => {
    const user = getLoggedInUser();
    const name = user?.name || user?.full_name || user?.firstName || user?.fullName || user?.username || "Admin";
    setAdminName(name);
    setProfilePic(user?.profilePicture || null);
  };

  useEffect(() => {
    syncFromStorage();
    const handleUpdate = (e) => {
      if (e.detail?.name !== undefined) setAdminName(e.detail.name || "Admin");
      if (e.detail?.profilePicture !== undefined) setProfilePic(e.detail.profilePicture || null);
    };
    window.addEventListener("profileUpdated", handleUpdate);
    return () => window.removeEventListener("profileUpdated", handleUpdate);
  }, []);

  const initial = (adminName || "A").charAt(0).toUpperCase();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <Navbar className={`${styles.headerMainBox}`}>
        <Container fluid style={{ paddingLeft: "24px", paddingRight: "24px" }}>
          {/* Mobile hamburger */}
          {onToggle && (
            <button className="header-hamburger" onClick={onToggle} aria-label="Toggle menu">
              {sidebarOpen ? <IoClose size={22} /> : <HiMenuAlt2 size={22} />}
            </button>
          )}

          {/* Brand */}
          <Navbar.Brand className="dflexAC" style={{ gap: "10px" }}>
            <Image
              src="/images/meridiet-logo.png"
              alt="MeriDiet"
              style={{ height: "34px", width: "auto", objectFit: "contain" }}
            />
            <span style={{
              borderLeft: "1px solid #E4EAE6",
              paddingLeft: "10px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#6b7280",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}>ADMIN</span>
          </Navbar.Brand>

          {/* Right section */}
          <div className="dflexAC header-right-section">
            {/* Date pill */}
            <div className="header-date-pill dflexAC">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1E8E3E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="header-date-text">{today}</span>
            </div>

            <div className="header-vdivider" />

            {/* Admin info */}
            <div className="dflexAC header-admin-wrap">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Admin"
                  className="header-avatar-img"
                />
              ) : (
                <div className="header-avatar dflexCC">{initial}</div>
              )}
              <div className="header-admin-info">
                <p className="header-admin-name">{adminName}</p>
                <p className="header-admin-role">Administrator</p>
              </div>
            </div>
          </div>
        </Container>
      </Navbar>

      <style>{`
        .header-hamburger {
          display: none;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid #E4EAE6;
          border-radius: 8px;
          padding: 6px 10px;
          color: #1E8E3E;
          cursor: pointer;
          flex-shrink: 0;
          margin-right: 10px;
          transition: background 0.2s ease;
        }

        .header-hamburger:hover {
          background: #f0f9f3;
        }

        @media (max-width: 991px) {
          .header-hamburger {
            display: flex;
          }
        }

        .header-logo-ring {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: linear-gradient(135deg, #e8f5ee 0%, #d1ead9 100%);
          border: 1px solid rgba(30, 142, 62, 0.2);
          flex-shrink: 0;
        }

        .header-brand-main {
          color: #111827;
          font-weight: 800;
          font-size: 17px;
          letter-spacing: 2px;
        }

        .header-brand-accent {
          color: #1E8E3E;
          font-weight: 800;
          font-size: 17px;
          letter-spacing: 2px;
        }

        .header-brand-sep {
          color: #ddd;
          font-weight: 300;
          font-size: 16px;
          margin: 0 2px;
        }

        .header-brand-sub {
          color: #6b7280;
          font-weight: 500;
          font-size: 12px;
          letter-spacing: 1.5px;
        }

        .header-brand-line {
          height: 2px;
          width: 70%;
          background: linear-gradient(90deg, #1E8E3E 0%, transparent 100%);
          border-radius: 2px;
          margin-top: 3px;
        }

        /* Prevent Bootstrap's default flex-wrap from wrapping navbar rows */
        .navbar > .container-fluid {
          flex-wrap: nowrap !important;
          align-items: center;
        }

        .navbar-brand {
          flex-shrink: 0;
          white-space: nowrap;
        }

        .header-right-section {
          gap: 18px;
          flex-shrink: 0;
        }

        .header-date-pill {
          gap: 7px;
          background: #f0f9f3;
          border: 1px solid rgba(30, 142, 62, 0.15);
          border-radius: 8px;
          padding: 6px 13px;
        }

        .header-date-text {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .header-vdivider {
          width: 1px;
          height: 30px;
          background: #E4EAE6;
        }

        .header-admin-wrap {
          gap: 10px;
          cursor: pointer;
        }

        .header-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1E8E3E 0%, #4ade80 100%);
          color: #fff;
          font-weight: 800;
          font-size: 15px;
          flex-shrink: 0;
          box-shadow: 0 3px 10px rgba(30, 142, 62, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-avatar-img {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          box-shadow: 0 3px 10px rgba(30, 142, 62, 0.25);
          border: 2px solid #E4EAE6;
        }

        .header-admin-info p {
          margin: 0;
          line-height: 1.25;
        }

        .header-admin-name {
          font-weight: 700 !important;
          font-size: 13px !important;
          color: #111827 !important;
        }

        .header-admin-role {
          font-size: 11px !important;
          color: #1E8E3E !important;
          font-weight: 500 !important;
        }

        /* On tablet/mobile (hamburger visible), collapse non-essential header items */
        @media (max-width: 991px) {
          .header-date-pill { display: none; }
          .header-vdivider { display: none; }
          .header-admin-info { display: none; }
          .header-brand-line { display: none; }
        }

        @media (max-width: 575px) {
          .header-brand-sep,
          .header-brand-sub { display: none; }
        }
      `}</style>
    </>
  );
}

export default Header;
