// DashboardLayout.jsx
// -----------------------------------------------------------------------------
// Purpose : Admin dashboard shell with a collapsible sidebar, header actions,
//           and routed main content. Includes logout confirmation.
// -----------------------------------------------------------------------------

import axios from "axios"; // (not used directly here, but kept as in original)
import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";

// Icons
import {
  FaTachometerAlt,
  FaPlusCircle,
  FaTools,
  FaBars,
  FaSignOutAlt,
} from "react-icons/fa";
import { MdProductionQuantityLimits } from "react-icons/md";

// UI libs & meta
import Swal from "sweetalert2";
import { Helmet } from "react-helmet";

// Assets
import HomeIcone from "../../../public/fav-icon.png";

// Styles
import "../../Styles/StylesDashboardLayout.css";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: "سيتم تسجيل خروجك من لوحة تحكم المدير",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#8B5C3E",
      cancelButtonColor: "#d33",
      confirmButtonText: "نعم، سجّل خروجي!",
      cancelButtonText: "إلغاء",
    });

    if (result.isConfirmed) {
      localStorage.removeItem("token");
      Swal.fire({
        title: "تم تسجيل الخروج",
        text: "تم إنهاء جلسة المدير بنجاح.",
        icon: "success",
        confirmButtonColor: "#8B5C3E",
        timer: 2000,
      });
      navigate("/");
    }
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    document.documentElement.dir = "rtl";
    return () => {
      const savedLang = localStorage.getItem("language");
      document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
    };
  }, []);

  return (
    <section
  dir="rtl"
  className="dashboard-container flex overflow-hidden"
>
      <Helmet>
        <title>لوحة تحكم المدير</title>
      </Helmet>

      {/* Mobile Sidebar Toggle (RIGHT) */}
      <button
        className="mobile-menu-button md:hidden flex items-center justify-center w-12 h-12"
        onClick={toggleSidebar}
        aria-label="فتح القائمة"
      >
        <FaBars className="h-6 w-6" />
      </button>

      {/* Sidebar */}
      <aside
        className={`sidebar bg-gray-800 text-white md:flex flex-col justify-between z-40 ${
          sidebarOpen ? "open" : ""
        }`}
      >
        {/* Home link (logo button) */}
        <div className="sidebar-logo mt-24 flex items-center justify-center w-full">
          <Link
            to="/"
            className="sidebar-homebtn"
            onClick={closeSidebar}
            aria-label="الصفحة الرئيسية"
          >
            <img
              src={HomeIcone}
              alt="الصفحة الرئيسية"
              className="sidebar-homeimg"
            />
          </Link>
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav mt-4 flex-grow">
          <Link
            to="/dashboard"
            className="sidebar-link sidebar-link--active justify-center"
            onClick={closeSidebar}
          >
            <FaTachometerAlt className="h-4 w-4 ml-2" />
            <span className="sidebar-text">لوحة التحكم</span>
          </Link>

          <Link
            to="/dashboard/add-new-product"
            className="sidebar-link justify-center"
            onClick={closeSidebar}
          >
            <FaPlusCircle className="h-4 w-4 ml-2" />
            <span className="sidebar-text">إضافة منتج</span>
          </Link>

          <Link
            to="/dashboard/manage-products"
            className="sidebar-link justify-center"
            onClick={closeSidebar}
          >
            <MdProductionQuantityLimits className="h-4 w-4 ml-2" />
            <span className="sidebar-text">إدارة المنتجات</span>
          </Link>
        </nav>

        {/* Logout (bottom icon button) */}
        <div className="p-2 flex justify-center mt-auto">
          <button
            onClick={() => {
              closeSidebar();
              handleLogout();
            }}
            className="sidebar-logouticon"
            aria-label="تسجيل الخروج"
            type="button"
          >
            <FaSignOutAlt className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-grow text-gray-800 overflow-auto">
        <header className="dashboard-header sticky top-0 z-30 w-full">
          <h1 className="dashboard-title">لوحة التحكم</h1>

          <div className="dashboard-actions">
            <Link to="/dashboard/add-new-product" className="w-full md:w-auto">
              <button className="dashbtn dashbtn--primary" type="button">
                <FaPlusCircle className="h-5 w-5 ml-2" />
                إضافة منتج
              </button>
            </Link>

            <Link to="/dashboard/manage-products" className="w-full md:w-auto">
              <button className="dashbtn dashbtn--neutral" type="button">
                <FaTools className="h-5 w-5 ml-2" />
                إدارة المنتجات
              </button>
            </Link>

            <button
              onClick={handleLogout}
              className="dashbtn dashbtn--danger md:w-auto"
              type="button"
            >
              <FaSignOutAlt className="h-5 w-5 ml-2" />
              تسجيل الخروج
            </button>
          </div>
        </header>

        <main className="p-6 sm:p-8 space-y-4 overflow-auto">
          <Outlet />
        </main>
      </div>
    </section>
  );
};

export default DashboardLayout;