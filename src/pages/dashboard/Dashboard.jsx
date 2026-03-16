// src/pages/dashboard/Dashboard.jsx
// -----------------------------------------------------------------------------
// Admin dashboard showing ONLY:
// - totalProducts
// - totalOrders
// - totalSales
// - monthlySales
// -----------------------------------------------------------------------------
// Auth:
// - Requires admin token in localStorage ("token" / "adminToken")
// -----------------------------------------------------------------------------
// Auto refresh:
// - Refreshes admin stats every 5 seconds without page reload
// - First load shows loader
// - Next refreshes are silent to avoid flicker
// -----------------------------------------------------------------------------

import { FaBoxOpen, FaClipboardList, FaChartLine } from "react-icons/fa";
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Loading from "../../components/Loading";
// import RevenueChart from "./RevenueChart";
import ManageOrders from "./manageOrders/manageOrder";
import getBaseUrl from "../../utils/baseURL";

const REFRESH_INTERVAL = 5000;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalOrders: 0,
    monthlySales: [],
    trendingProducts: 0,
  });
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const getAdminToken = () =>
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token") ||
    "";

  const clearAdminSession = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminToken_expiresAt");
    localStorage.removeItem("token");
  };

  const handleUnauthorized = useCallback(() => {
    clearAdminSession();
    navigate("/admin");
  }, [navigate]);

  const fetchDashboardStats = useCallback(
    async ({ initial = false } = {}) => {
      const token = getAdminToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      try {
        if (initial) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const response = await axios.get(`${getBaseUrl()}/api/admin`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 20000,
        });

        if (!isMountedRef.current) return;

        setData({
          totalProducts: response?.data?.totalProducts ?? 0,
          totalSales: response?.data?.totalSales ?? 0,
          totalOrders: response?.data?.totalOrders ?? 0,
          monthlySales: Array.isArray(response?.data?.monthlySales)
            ? response.data.monthlySales
            : [],
          trendingProducts: response?.data?.trendingProducts ?? 0,
        });

        setError("");
      } catch (err) {
        if (!isMountedRef.current) return;

        const status = err?.response?.status;
        const msg =
          err?.response?.data?.message ||
          (status === 401
            ? "انتهت جلستك. يرجى تسجيل الدخول مرة أخرى."
            : status === 403
            ? "ليس لديك صلاحية الدخول."
            : "حدث خطأ أثناء تحميل الإحصائيات.");

        setError(msg);

        if (status === 401 || status === 403) {
          handleUnauthorized();
        }

        console.error("[Dashboard] fetch /api/admin failed:", err);
      } finally {
        if (!isMountedRef.current) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [handleUnauthorized]
  );

  useEffect(() => {
    isMountedRef.current = true;

    const token = getAdminToken();
    if (!token) {
      navigate("/admin");
      return;
    }

    fetchDashboardStats({ initial: true });

    intervalRef.current = setInterval(() => {
      fetchDashboardStats({ initial: false });
    }, REFRESH_INTERVAL);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchDashboardStats, navigate]);

  if (loading) {
    return (
      <div
        className="flex justify-center items-center min-h-screen bg-gray-100"
        dir="rtl"
      >
        <Loading />
      </div>
    );
  }

  const stats = [
    {
      icon: <FaBoxOpen className="h-6 w-6" />,
      value: data?.totalProducts ?? 0,
      label: "إجمالي المنتجات",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
    },
    {
      icon: <FaChartLine className="h-6 w-6" />,
      value: `${data?.totalSales ?? 0} USD`,
      label: "إجمالي المبيعات",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200",
    },
    {
      icon: <FaClipboardList className="h-6 w-6" />,
      value: data?.totalOrders ?? 0,
      label: "إجمالي الطلبات",
      bgColor: "bg-teal-50",
      textColor: "text-teal-700",
      borderColor: "border-teal-200",
    },
  ];

  return (
    <div dir="rtl" className="p-4 lg:p-8 w-full max-w-[100vw] mx-auto">
      <div className="flex items-center justify-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 text-center">
          لوحة التحكم — الإدارة
        </h1>
      </div>

      {error && (
        <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm text-right">
          {error}
        </div>
      )}

      <div className="mb-4 flex justify-start">
        <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-2">
          {refreshing ? "جاري تحديث الإحصائيات..." : "تحديث تلقائي كل 5 ثوانٍ"}
        </div>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`border ${stat.borderColor} ${stat.bgColor} shadow-sm p-4 h-28 flex items-center`}
          >
            <div
              className={`flex items-center justify-center h-12 w-12 mr-4 ${stat.textColor} bg-white/70 border border-black/5`}
              aria-hidden="true"
            >
              {stat.icon}
            </div>
            <div className="min-w-0 text-right">
              <div className="text-xs text-gray-600 truncate">{stat.label}</div>
              <div className="text-xl font-bold leading-tight">{stat.value}</div>
            </div>
          </div>
        ))}
      </section>

      {/*
      <section className="flex flex-col lg:flex-row gap-6 overflow-x-auto">
        <div className="flex-1 bg-white shadow-sm border border-gray-200 p-6 min-w-[520px]">
          <div className="font-semibold mb-4 text-lg text-right">
            الإيرادات حسب الأشهر
          </div>

          <div className="flex items-center justify-center bg-gray-50 border-2 border-gray-200 border-dashed p-4">
            <RevenueChart monthlySales={data?.monthlySales || []} />
          </div>
        </div>
      </section>
      */}

      <section className="bg-white shadow-sm p-6 mt-6 overflow-x-auto min-w-[520px] border border-gray-200">
        <ManageOrders />
      </section>
    </div>
  );
};

export default Dashboard;