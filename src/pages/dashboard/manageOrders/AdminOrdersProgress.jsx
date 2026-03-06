// src/pages/dashboard/manageOrders/AdminOrdersProgress.jsx
/* =============================================================================
   ✅ AdminOrdersProgress — Per-piece productProgress (RTL)
   ✅ BIG checkbox tiles (0/20/40/60/80/100) — instant save to DB
   ✅ Premium UI (no radius) + bigger clickable images
   ✅ Works with ordersApi.js using updateOrder(PATCH /api/orders/:id)
   ✅ Restores notify at 60% / 100% with item number (piece X of Y) + embroidery
   ✅ SweetAlert in Arabic (toast + dialogs)
============================================================================= */

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Swal from "sweetalert2";

import {
  useGetAllOrdersQuery,
  useUpdateOrderMutation,
  useSendOrderNotificationMutation,
} from "../../../redux/features/orders/ordersApi.js";

import { getImgUrl } from "../../../utils/getImgUrl";

/* ---------------- Helpers ---------------- */

const safeText = (v) =>
  typeof v === "string" ? v.trim() : String(v ?? "").trim();

const getLinePid = (prod) =>
  typeof prod?.productId === "string"
    ? prod.productId
    : prod?.productId?._id || "";

const pickColorName = (prod) => {
  const cn = prod?.color?.colorName;
  if (!cn) return "أصلي";
  if (typeof cn === "string") return cn.trim() || "أصلي";
  if (typeof cn === "object")
    return (cn.ar || cn.fr || cn.en || "").trim() || "أصلي";
  return "أصلي";
};

const embroideryText = (prod) => {
  const raw = prod?.embroideryCategory || prod?.productId?.embroideryCategory;
  if (!raw) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "object") return safeText(raw.ar || raw.fr || raw.en || "");
  return "";
};

const PROGRESS_STEPS = [0, 20, 40, 60, 80, 100];

export default function AdminOrdersProgress() {
  const { data, isLoading, error, refetch } = useGetAllOrdersQuery(undefined, {
    pollingInterval: 5000,
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });

  const [updateOrder] = useUpdateOrderMutation();
  const [sendNotification] = useSendOrderNotificationMutation();

  const orders = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.orders)) return data.orders;
    if (Array.isArray(data?.data?.orders)) return data.data.orders;
    return [];
  }, [data]);

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [orders]
  );

  // uiProgress: fullKey -> value
  const [uiProgress, setUiProgress] = useState({});
  const [savingMap, setSavingMap] = useState({});

  // Initialize UI state from DB (order.productProgress)
  useEffect(() => {
    const initial = {};
    for (const order of orders) {
      const orderId = order?._id;
      if (!orderId) continue;

      const progressMap = order?.productProgress || {};
      const lines = Array.isArray(order?.products) ? order.products : [];

      lines.forEach((prod, lineIndex) => {
        const pid = getLinePid(prod);
        if (!pid) return;

        const colorName = safeText(pickColorName(prod));
        const qty = Math.max(1, Number(prod?.quantity || 1));

        for (let itemIndex = 0; itemIndex < qty; itemIndex++) {
          const productKey = `${pid}|${colorName}|${lineIndex}-${itemIndex}`;
          const fullKey = `${orderId}|${productKey}`;
          initial[fullKey] = Number(progressMap?.[productKey] ?? 0);
        }
      });
    }
    setUiProgress(initial);
  }, [orders]);

  const toastOk = (title = "تم الحفظ") =>
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title,
      showConfirmButton: false,
      timer: 1100,
    });

  const toastInfo = (title = "تم") =>
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "info",
      title,
      showConfirmButton: false,
      timer: 1400,
    });

  const toastErr = (msg) =>
    Swal.fire({
      icon: "error",
      title: "خطأ",
      text: msg || "فشل التحديث. تحقق من السيرفر.",
      confirmButtonText: "حسناً",
    });

  /**
   * ✅ Save per-piece progress to DB (merge safely), and notify at 60/100.
   * - productKey includes lineIndex-itemIndex so backend can show piece # correctly.
   * - avoid duplicate notify if value already equals val in DB.
   */
  const persistProgressToDb = useCallback(
    async ({ order, productKey, value }) => {
      const orderId = order?._id;
      if (!orderId) return;

      const val = Number(value);
      if (!Number.isFinite(val)) return;

      const fullKey = `${orderId}|${productKey}`;

      // Previous DB value (avoid duplicate notify)
      const prevDb = Number(order?.productProgress?.[productKey] ?? 0);

      // Optimistic UI
      setUiProgress((prev) => ({ ...prev, [fullKey]: val }));
      setSavingMap((prev) => ({ ...prev, [fullKey]: true }));

      try {
        // ✅ Merge map and save in Mongo (PATCH /api/orders/:id)
        const merged = { ...(order?.productProgress || {}), [productKey]: val };

        await updateOrder({
          orderId,
          productProgress: merged,
        }).unwrap();

        // ✅ Notify at 60 / 100 ONLY if value changed
        const email = safeText(order?.email);
        if ([60, 100].includes(val) && email && prevDb !== val) {
          await sendNotification({
            orderId,
            email,
            progress: val,
            productKey, // IMPORTANT: include full productKey for piece info in email
          }).unwrap();

          toastInfo(val === 60 ? "تم إرسال إشعار 60٪ للعميل" : "تم إرسال إشعار 100٪ للعميل");
        }

        toastOk("تم حفظ تقدّم القطعة");
        refetch?.();
      } catch (e) {
        // Revert UI best-effort (remove optimistic so it falls back to DB)
        setUiProgress((prev) => {
          const copy = { ...prev };
          delete copy[fullKey];
          return copy;
        });

        const msg = e?.data?.message || e?.error || e?.message;
        toastErr(msg);
      } finally {
        setSavingMap((prev) => ({ ...prev, [fullKey]: false }));
      }
    },
    [refetch, sendNotification, updateOrder]
  );

  if (isLoading) {
    return (
      <div dir="rtl" style={{ padding: 16, border: "1px solid #e5e7eb", marginTop: 12 }}>
        <p style={{ margin: 0 }}>جاري تحميل تقدّم الطلبات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" style={{ padding: 16, border: "1px solid #e5e7eb", marginTop: 12 }}>
        فشل تحميل البيانات، حاول لاحقاً
      </div>
    );
  }

  return (
    <section className="wz-aop" dir="rtl" lang="ar">
      <style>{`
        .wz-aop{direction:rtl;background:#fff;color:#111;padding:28px 0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;}
        .wz-aop,.wz-aop *{border-radius:0 !important;}
        .wz-aop__container{max-width:1500px;margin:0 auto;padding:0 20px;}

        .wz-aop__header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border:1px solid #e5e7eb;background:#fff;gap:12px;}
        .wz-aop__title{font-size:17px;font-weight:900;margin:0;letter-spacing:.3px;}
        .wz-aop__btn{padding:10px 18px;font-size:13px;font-weight:800;border:1px solid #111;background:#111;color:#fff;cursor:pointer;transition:background .2s ease;}
        .wz-aop__btn:hover{background:#000;}

        .wz-aop__tableWrap{margin-top:14px;border:1px solid #e5e7eb;overflow-x:auto;overflow-y:hidden;transform:rotateX(180deg);background:#fff;}
        .wz-aop__table{th:100%;min-width:1650px;border-collapse:collapse;transform:rotateX(180deg);}
        .wz-aop__tableWrap::-webkit-scrollbar{height:8px;}
        .wz-aop__tableWrap::-webkit-scrollbar-thumb{background:#d1d5db;}

        .wz-aop__table th{background:#111;color:#fff;font-size:12px;font-weight:900;padding:16px 12px;text-align:right;border-left:1px solid #1f2937;white-space:nowrap;}
        .wz-aop__table th:first-child{border-left:none;}
        .wz-aop__table td{padding:16px 12px;font-size:13px;border-top:1px solid #f1f5f9;border-left:1px solid #f1f5f9;vertical-align:top;background:#fff;}
        .wz-aop__table td:first-child{border-left:none;}
        .wz-aop__table tbody tr:nth-child(even) td{background:#fafafa;}

        .wz-aop__mono{font-family:ui-monospace,Menlo,Monaco,Consolas,"Courier New",monospace;font-size:12px;}
        .wz-aop__ltr{direction:ltr;unicode-bidi:plaintext;}
        .wz-aop__orderCell{display:flex;flex-direction:column;gap:6px;}
        .wz-aop__sub{font-size:11px;color:#6b7280;}
        .wz-aop__subLabel{font-weight:800;color:#111;}
        .wz-aop__client{display:flex;flex-direction:column;gap:4px;}
        .wz-aop__clientName{font-weight:900;}
        .wz-aop__clientMeta{font-size:11px;color:#6b7280;}

        .wz-aop__products{min-width:980px;}
        .wz-aop__product{
          display:grid;
          grid-template-columns: 1fr 140px;
          gap:16px;
          padding:14px;
          border:1px solid #f3f4f6;
          background:#fff;
        }
        .wz-aop__product + .wz-aop__product{margin-top:12px;}
        .wz-aop__line{display:flex;gap:6px;font-size:13px;}
        .wz-aop__k{font-weight:900;}

        .wz-aop__thumbLink{display:block;text-decoration:none;color:inherit;}
        .wz-aop__thumb{
          width: 132px;height: 132px;border:1px solid #e5e7eb;background:#fff;
          display:flex;align-items:center;justify-content:center;overflow:hidden;
        }
        .wz-aop__img{width:100%;height:100%;object-fit:cover;display:block;transform:scale(1);transition:transform .18s ease;}
        .wz-aop__thumbLink:hover .wz-aop__img{transform:scale(1.06);}
        .wz-aop__img--empty{
          width:132px;height:132px;display:flex;align-items:center;justify-content:center;
          font-size:12px;color:#9ca3af;border:1px solid #e5e7eb;background:#fff;text-align:center;padding:10px;
        }
        .wz-aop__thumbHint{margin-top:8px;font-size:11px;color:#6b7280;text-align:center;}

        .wz-aop__pieces{margin-top:10px;display:flex;flex-direction:column;gap:10px;}
        .wz-aop__pieceRow{
          display:grid;
          grid-template-columns: 170px 1fr;
          gap:12px;
          align-items:center;
          border-top:1px dashed #e5e7eb;
          padding-top:12px;
        }
        .wz-aop__pieceLeft{display:flex;align-items:center;justify-content:flex-start;gap:10px;}
        .wz-aop__badge{font-size:13px;font-weight:900;background:#f3f4f6;padding:8px 12px;border:1px solid #e5e7eb;}
        .wz-aop__saving{font-size:12px;color:#6b7280;}

        .wz-aop__checks{display:grid;grid-template-columns: repeat(6, minmax(98px, 1fr));gap:10px;}
        .wz-aop__tile{
          display:flex;align-items:center;justify-content:center;gap:10px;
          padding:16px 12px;border:1px solid #d1d5db;background:#fff;
          cursor:pointer;user-select:none;font-weight:900;font-size:14px;
          transition:background .15s ease,border-color .15s ease,color .15s ease,transform .05s ease;
        }
        .wz-aop__tile:hover{border-color:#111;background:#f3f4f6;}
        .wz-aop__tile--active{border-color:#111;background:#111;color:#fff;}
        .wz-aop__tile--active:hover{background:#1f2937;border-color:#1f2937;}
        .wz-aop__tile:focus{outline:none;}
        .wz-aop__tile:focus-visible{outline:3px solid rgba(17,17,17,0.25);outline-offset:3px;}
        .wz-aop__tile:active{transform: translateY(1px);}
        .wz-aop__tile[aria-disabled="true"]{opacity:.55;cursor:not-allowed;}

        .wz-aop__box{width:22px;height:22px;border:2px solid currentColor;display:inline-flex;align-items:center;justify-content:center;transition:transform .12s ease;}
        .wz-aop__tile:hover .wz-aop__box{transform:scale(1.05);}
        .wz-aop__tick{width:12px;height:12px;background:currentColor;}

        @media (max-width:900px){
          .wz-aop__header{flex-direction:column;align-items:stretch;}
          .wz-aop__btn{width:100%;}
          .wz-aop__pieceRow{grid-template-columns: 1fr;}
          .wz-aop__checks{grid-template-columns: repeat(3, minmax(98px, 1fr));}
          .wz-aop__product{grid-template-columns: 1fr 140px;}
        }
      `}</style>

      <div className="wz-aop__container">
        <header className="wz-aop__header">
          <h3 className="wz-aop__title">متابعة تقدّم الطلبات (حفظ مباشر)</h3>
          <button type="button" className="wz-aop__btn" onClick={() => refetch?.()}>
            تجديد
          </button>
        </header>

        <div className="wz-aop__tableWrap">
          <table className="wz-aop__table">
            <thead>
              <tr>
                <th>#</th>
                <th>الطلب</th>
                <th>العميل</th>
                <th>المنتجات (كل قطعة)</th>
              </tr>
            </thead>

            <tbody>
              {sortedOrders.map((order, index) => {
                const lines = Array.isArray(order?.products) ? order.products : [];

                return (
                  <tr key={order?._id || index}>
                    <td className="wz-aop__mono">{index + 1}</td>

                    <td title={order?._id}>
                      <div className="wz-aop__orderCell">
                        <div className="wz-aop__mono wz-aop__ltr">
                          {order?._id ? `${order._id.slice(0, 8)}...` : "—"}
                        </div>

                        {order?.orderId ? (
                          <div className="wz-aop__sub">
                            <span className="wz-aop__subLabel">ID تتبّع:</span>{" "}
                            <span className="wz-aop__mono wz-aop__ltr">{order.orderId}</span>
                          </div>
                        ) : null}

                        <div className="wz-aop__sub">
                          <span className="wz-aop__subLabel">تاريخ:</span>{" "}
                          {order?.createdAt ? new Date(order.createdAt).toLocaleString("ar-TN") : "—"}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="wz-aop__client">
                        <div className="wz-aop__clientName">{order?.name || "—"}</div>
                        <div className="wz-aop__clientMeta wz-aop__ltr wz-aop__mono">
                          {order?.email || "—"}
                        </div>
                        <div className="wz-aop__clientMeta wz-aop__ltr wz-aop__mono">
                          {order?.phone || "—"}
                        </div>
                      </div>
                    </td>

                    <td className="wz-aop__products">
                      {lines.length ? (
                        lines.map((prod, lineIndex) => {
                          const pid = getLinePid(prod);
                          if (!pid) {
                            return (
                              <div key={`missing-${lineIndex}`} className="wz-aop__product">
                                <div style={{ color: "#9ca3af" }}>منتج غير صالح (productId مفقود)</div>
                              </div>
                            );
                          }

                          const colorName = safeText(pickColorName(prod));
                          const qty = Math.max(1, Number(prod?.quantity || 1));
                          const emb = safeText(embroideryText(prod));
                          const colorImage = prod?.color?.image;
                          const fullImgUrl = colorImage ? getImgUrl(colorImage) : "";

                          return (
                            <div key={`${pid}-${lineIndex}`} className="wz-aop__product">
                              <div>
                                <div className="wz-aop__line">
                                  <span className="wz-aop__k">ID:</span>
                                  <span className="wz-aop__mono wz-aop__ltr">{String(pid).slice(0, 8)}</span>
                                </div>

                                <div className="wz-aop__line">
                                  <span className="wz-aop__k">اللون:</span>
                                  <span>{colorName}</span>
                                </div>

                                {emb ? (
                                  <div className="wz-aop__line">
                                    <span className="wz-aop__k">التطريز:</span>
                                    <span>{emb}</span>
                                  </div>
                                ) : null}

                                <div className="wz-aop__pieces">
                                  {Array.from({ length: qty }, (_, itemIndex) => {
                                    const productKey = `${pid}|${colorName}|${lineIndex}-${itemIndex}`;
                                    const fullKey = `${order._id}|${productKey}`;

                                    const current =
                                      uiProgress?.[fullKey] ??
                                      Number(order?.productProgress?.[productKey] ?? 0);

                                    const saving = !!savingMap?.[fullKey];

                                    return (
                                      <div key={fullKey} className="wz-aop__pieceRow">
                                        <div className="wz-aop__pieceLeft">
                                          <span className="wz-aop__badge">قطعة #{itemIndex + 1}</span>
                                          {saving ? <span className="wz-aop__saving">جاري الحفظ…</span> : null}
                                        </div>

                                        <div className="wz-aop__checks">
                                          {PROGRESS_STEPS.map((step) => {
                                            const active = Number(current) === Number(step);

                                            return (
                                              <div
                                                key={step}
                                                role="button"
                                                tabIndex={0}
                                                aria-disabled={saving ? "true" : "false"}
                                                className={`wz-aop__tile ${active ? "wz-aop__tile--active" : ""}`}
                                                onClick={() => {
                                                  if (saving) return;
                                                  persistProgressToDb({ order, productKey, value: step });
                                                }}
                                                onKeyDown={(e) => {
                                                  if (saving) return;
                                                  if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    persistProgressToDb({ order, productKey, value: step });
                                                  }
                                                }}
                                                title={saving ? "جاري الحفظ..." : `حفظ في قاعدة البيانات: ${step}%`}
                                              >
                                                <span className="wz-aop__box">
                                                  {active ? <span className="wz-aop__tick" /> : null}
                                                </span>
                                                <span>{step}%</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div>
                                {fullImgUrl ? (
                                  <>
                                    <a
                                      className="wz-aop__thumbLink"
                                      href={fullImgUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="فتح الصورة بالحجم الكامل"
                                    >
                                      <div className="wz-aop__thumb">
                                        <img
                                          src={fullImgUrl}
                                          alt={`صورة المنتج — ${colorName}`}
                                          className="wz-aop__img"
                                          loading="lazy"
                                        />
                                      </div>
                                    </a>
                                    <div className="wz-aop__thumbHint">اضغط لفتح الصورة كاملة</div>
                                  </>
                                ) : (
                                  <div className="wz-aop__img--empty">لا توجد صورة</div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <span style={{ color: "#9ca3af" }}>لا توجد منتجات</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}