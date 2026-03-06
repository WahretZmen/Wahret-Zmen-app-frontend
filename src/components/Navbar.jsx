// src/components/Navbar.jsx
// -----------------------------------------------------------------------------
// Navbar (RTL): logo + links + search + track order + cart  (NO AUTH)
// ✅ FIXED: Scroll to TOP works even if your app uses a scroll container
// - Scrolls window + document + ".main-content" + "#root" + "[data-scroll-container]"
// - Runs after navigation with double rAF (very reliable)
// - Keeps Ctrl/Cmd click / middle click behavior (new tab)
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiMenu, FiSearch, FiShoppingBag, FiX } from "react-icons/fi";
import { Package } from "lucide-react";

import logoImg from "../../src/assets/Logo/Logo-Boutique-Wahret-Zmen.png";
import "../Styles/StylesNavbar.css";

const Navbar = () => {
  // ----------------------------
  // Config
  // ----------------------------
  const dir = "rtl";
  const isRTL = true;
  const MOBILE_BP = 1024;
  const SIDE_WIDTH = 320;

  // ----------------------------
  // State
  // ----------------------------
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // ----------------------------
  // Refs
  // ----------------------------
  const headerRef = useRef(null);
  const sidebarRef = useRef(null);

  // ----------------------------
  // Data
  // ----------------------------
  const cartItems = useSelector((state) => state?.cart?.cartItems || []);
  const navigate = useNavigate();
  const location = useLocation();

  // ----------------------------
  // Close helper
  // ----------------------------
  const closeAll = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // ----------------------------
  // ✅ Real scroll-to-top (supports scroll containers)
  // ----------------------------
  const scrollToTopHard = useCallback(() => {
    // 1) Window
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch {
      // ignore
    }

    // 2) Document roots
    const roots = [document.documentElement, document.body].filter(Boolean);
    roots.forEach((el) => {
      try {
        el.scrollTop = 0;
        el.scrollLeft = 0;
      } catch {
        // ignore
      }
    });

    // 3) Common app scroll containers (your project uses "main-content")
    const containers = [
      document.querySelector(".main-content"),
      document.querySelector("#root"),
      document.querySelector("[data-scroll-container]"),
    ].filter(Boolean);

    containers.forEach((el) => {
      try {
        el.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
      } catch {
        try {
          el.scrollTop = 0;
          el.scrollLeft = 0;
        } catch {
          // ignore
        }
      }
    });
  }, []);

  // Run scroll after route is committed (double rAF = pro reliable)
  const scrollAfterNav = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToTopHard();
      });
    });
  }, [scrollToTopHard]);

  /**
   * ✅ Premium navigation handler:
   * - Preserves new-tab behavior
   * - Navigates then scrolls after nav
   */
  const navTo = useCallback(
    (to) => (e) => {
      // Allow normal browser behavior for new tab/window
      if (
        e &&
        (e.defaultPrevented ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey)
      ) {
        return;
      }

      if (e) e.preventDefault();

      closeAll();

      const current = `${location.pathname}${location.search}`;
      if (to === current) {
        scrollAfterNav();
        return;
      }

      navigate(to);

      // Ensure scroll happens after navigation is rendered
      scrollAfterNav();
    },
    [closeAll, navigate, location.pathname, location.search, scrollAfterNav]
  );

  // ----------------------------
  // Layout height + breakpoint
  // ----------------------------
  useEffect(() => {
    const updateLayout = () => {
      const h = headerRef.current?.offsetHeight || 60;
      document.documentElement.style.setProperty("--navbar-height", `${h}px`);
      document.documentElement.setAttribute("dir", dir);
      setIsMobile(window.matchMedia(`(max-width: ${MOBILE_BP}px)`).matches);
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, [dir]);

  // ----------------------------
  // Close drawer on route change (NO scroll here)
  // ----------------------------
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname, location.search]);

  // ----------------------------
  // Close on outside click + ESC
  // ----------------------------
  useEffect(() => {
    const onMouseDown = (e) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target)
      ) {
        setIsSidebarOpen(false);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsSidebarOpen(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isSidebarOpen]);

  // ----------------------------
  // Search submit
  // ----------------------------
  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const q = searchValue.trim();
      if (!q) return;

      closeAll();
      navigate(`/products?search=${encodeURIComponent(q)}`);
      setSearchValue("");

      scrollAfterNav();
    },
    [navigate, searchValue, closeAll, scrollAfterNav]
  );

  // ----------------------------
  // Drawer positioning (RTL)
  // ----------------------------
  const anchorSide = dir === "rtl" ? "right" : "left";
  const hiddenTranslate = anchorSide === "right" ? "100%" : "-100%";

  const overlayStyle = useMemo(
    () => ({
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.32)",
      zIndex: 2500,
      display: isSidebarOpen ? "block" : "none",
    }),
    [isSidebarOpen]
  );

  const sidebarStyle = useMemo(
    () => ({
      position: "fixed",
      top: "var(--navbar-height, 58px)",
      bottom: 0,
      [anchorSide]: 0,
      width: `min(88vw, ${SIDE_WIDTH}px)`,
      background: "#F8F9FA",
      boxShadow:
        anchorSide === "right"
          ? "-2px 0 18px rgba(0,0,0,.18)"
          : "2px 0 18px rgba(0,0,0,.18)",
      zIndex: 2600,
      transform: `translateX(${isSidebarOpen ? "0" : hiddenTranslate})`,
      transition: "transform .25s ease",
      display: isMobile ? "flex" : "none",
      flexDirection: "column",
    }),
    [anchorSide, hiddenTranslate, isMobile, isSidebarOpen]
  );

  return (
    <header className="navbar-container" ref={headerRef}>
      <nav className="navbar-content" dir={dir}>
        {/* Logo */}
        <div className="navbar-left">
          <Link to="/" className="logo premium-logo" onClick={navTo("/")}>
            <span className="logo-emblem">
              <img src={logoImg} alt="شعار وهرة زمان" className="logo-img" />
            </span>
            <span className="logo-text">
              <span className="logo-text-shine">وهرة زمان</span>
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="mobile-menu-btn nav-icon-stack mobile-nav-stack"
          type="button"
          onClick={() => setIsSidebarOpen((s) => !s)}
        >
          {isSidebarOpen ? (
            <FiX className="menu-icon" />
          ) : (
            <FiMenu className="menu-icon" />
          )}
          <span className="nav-icon-label">
            {isSidebarOpen ? "إغلاق" : "القائمة"}
          </span>
        </button>

        {/* Desktop links */}
        <ul className="nav-links">
          <li><Link to="/" onClick={navTo("/")}>الرئيسية</Link></li>
          <li><Link to="/products" onClick={navTo("/products")}>المنتجات</Link></li>
          <li><Link to="/about" onClick={navTo("/about")}>من نحن</Link></li>
          <li><Link to="/contact" onClick={navTo("/contact")}>اتصل بنا</Link></li>

          <li className="nav-search">
            <form onSubmit={handleSearchSubmit} className="wz-search">
              <input
                type="text"
                dir={isRTL ? "rtl" : "ltr"}
                placeholder="ابحث عن المنتجات..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="wz-search__input"
              />
              <button type="submit" className="wz-search__btn">
                <FiSearch className="wz-search__icon" />
              </button>
            </form>
          </li>
        </ul>

        {/* Icons */}
        <div className="nav-icons">
          <Link
            to="/order-track"
            className="track-icon nav-icon-stack"
            onClick={navTo("/order-track")}
          >
            <span className="track-iconBox">
              <Package className="track-iconSvg" />
            </span>
            <span className="nav-icon-label">تتبع الطلب</span>
          </Link>

          <Link
            to="/cart"
            className="cart-icon nav-icon-stack"
            onClick={navTo("/cart")}
          >
            <FiShoppingBag className="icon" />
            {cartItems.length > 0 && (
              <span className="cart-badge">{cartItems.length}</span>
            )}
            <span className="nav-icon-label">السلة</span>
          </Link>
        </div>
      </nav>

      {/* Overlay */}
      <div style={overlayStyle} onClick={() => setIsSidebarOpen(false)} />

      {/* Mobile drawer */}
      <aside ref={sidebarRef} style={sidebarStyle} dir={dir}>
        <div style={{ padding: "12px", borderBottom: "1px solid #E5E7EB" }}>
          <strong>القائمة</strong>
        </div>

        <ul className="drawer-links" style={{ padding: "12px" }}>
          <li><Link to="/" onClick={navTo("/")}>الرئيسية</Link></li>
          <li><Link to="/products" onClick={navTo("/products")}>المنتجات</Link></li>
          <li><Link to="/about" onClick={navTo("/about")}>من نحن</Link></li>
          <li><Link to="/contact" onClick={navTo("/contact")}>اتصل بنا</Link></li>
          <li><Link to="/order-track" onClick={navTo("/order-track")}>تتبع الطلب</Link></li>
        </ul>
      </aside>
    </header>
  );
};

export default Navbar;