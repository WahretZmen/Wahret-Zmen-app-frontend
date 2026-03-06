// RevenueChart.jsx
// -----------------------------------------------------------------------------
// Arabic (Tunisia) + RTL layout
// - Uses orders list to compute monthly revenue (Jan -> Dec)
// - RTL tooltip/title/legend
// - Keeps labels in normal order; reverses X axis visually
// - Pro card UI (NO border-radius)
// -----------------------------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useGetAllOrdersQuery } from "../../redux/features/orders/ordersApi";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const monthLabels = [
  "جانفي",
  "فيفري",
  "مارس",
  "أفريل",
  "ماي",
  "جوان",
  "جويلية",
  "أوت",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const getMonthIndex = (dateLike) => {
  const d = new Date(dateLike);
  const t = d.getTime();
  if (!Number.isFinite(t)) return null;
  return d.getMonth(); // 0..11
};

const formatMoney = (n) => {
  const x = toNumber(n);
  return x.toLocaleString("fr-TN", { maximumFractionDigits: 2 });
};

const RevenueChart = () => {
  const { data: orders, error, isLoading } = useGetAllOrdersQuery();

  const revenueData = useMemo(() => {
    const monthly = Array(12).fill(0);
    if (Array.isArray(orders)) {
      for (const order of orders) {
        const m = getMonthIndex(order?.createdAt);
        if (m === null) continue;
        // Prefer totalPrice, fallback to total, fallback to 0
        const amount = toNumber(order?.totalPrice ?? order?.total ?? 0);
        monthly[m] += amount;
      }
    }
    return monthly;
  }, [orders]);

  const chartData = useMemo(() => {
    return {
      labels: monthLabels,
      datasets: [
        {
          label: "الإيرادات (USD)",
          data: revenueData,
          backgroundColor: "rgba(34, 197, 94, 0.7)",
          borderColor: "rgba(34, 197, 94, 1)",
          borderWidth: 1,
          barThickness: 18,
          maxBarThickness: 26,
        },
      ],
    };
  }, [revenueData]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 6, left: 6, right: 6, bottom: 0 } },

      plugins: {
        legend: {
          position: "top",
          rtl: true,
          textDirection: "rtl",
          labels: {
            boxWidth: 14,
            boxHeight: 14,
            usePointStyle: true,
            pointStyle: "rect",
            font: { size: 12 },
          },
        },
        title: {
          display: true,
          text: "الإيرادات الشهرية (بالدولار)",
          rtl: true,
          textDirection: "rtl",
          font: { size: 14, weight: "bold" },
          padding: { bottom: 10 },
        },
        tooltip: {
          rtl: true,
          textDirection: "rtl",
          callbacks: {
            label: (ctx) => {
              const v = ctx?.parsed?.y ?? 0;
              return `الإيرادات: ${formatMoney(v)} USD`;
            },
          },
        },
      },

      scales: {
        x: {
          reverse: true, // ✅ RTL visual direction
          grid: { display: false },
          ticks: {
            font: { size: 11 },
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `${formatMoney(value)}`,
            font: { size: 11 },
          },
        },
      },
    };
  }, []);

  if (isLoading) return <p dir="rtl">جارٍ تحميل بيانات الإيرادات...</p>;

  if (error) {
    return (
      <p dir="rtl">
        حدث خطأ أثناء جلب البيانات: {error?.message || "خطأ غير متوقع."}
      </p>
    );
  }

  return (
    <div dir="rtl" className="w-full max-w-3xl mx-auto">
      {/* Pro card (NO radius) */}
      <div className="bg-white border border-gray-200 shadow-sm p-4">
        <div className="w-full h-[300px] md:h-[400px]">
          <Bar data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;