
// src/pages/dashboard/manageOrders/AdminManageOrders.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  useGetAllOrdersQuery,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} from "../../../redux/features/orders/ordersApi.js";

import Swal from "sweetalert2";
import { getImgUrl } from "../../../utils/getImgUrl";
import { useTranslation } from "react-i18next";
import "../../../Styles/StylesAdminManageOrders.css";

/* =============================================================================
   ✅ AdminManageOrders — ORDER STATUS ONLY (NOT productProgress)
   ✅ Selector updates instantly (no Save/Cancel)
   ✅ Writes: order.status (string)
   ✅ Also sets isDelivered/isPaid when delivered
   ✅ FIX: updateOrder requires { orderId } in payload (ordersApi.js)
   ✅ UPDATE: Removed product title everywhere (table + modal)
   ✅ NEW: Bigger product images + open in new tab
============================================================================= */

const STATUSES = [
  "تم تأكيد الطلب",
  "قيد التحضير",
  "خارج للتسليم",
  "تم التسليم والدفع",
];

const safeText = (v) =>
  typeof v === "string" ? v.trim() : String(v ?? "").trim();

const getLinePid = (prod) =>
  typeof prod?.productId === "string"
    ? prod.productId
    : prod?.productId?._id || "";

const pickColorName = (prod, lang = "ar") => {
  const cn = prod?.color?.colorName;
  if (!cn) return "أصلي";
  if (typeof cn === "string") return cn.trim() || "أصلي";
  if (typeof cn === "object")
    return (cn[lang] || cn.ar || cn.fr || cn.en || "").trim() || "أصلي";
  return "أصلي";
};

export default function AdminManageOrders() {
  const { data, isLoading, error, refetch } = useGetAllOrdersQuery(undefined, {
    pollingInterval: 5000,
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });

  const [updateOrder] = useUpdateOrderMutation();
  const [deleteOrder] = useDeleteOrderMutation();

  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";

  const orders = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.orders)) return data.orders;
    if (Array.isArray(data?.data?.orders)) return data.data.orders;
    return [];
  }, [data]);

  const [uiStatus, setUiStatus] = useState({});
  const [savingMap, setSavingMap] = useState({});

  const embroideryText = (prod) => {
    const raw = prod?.embroideryCategory || prod?.productId?.embroideryCategory;
    if (!raw) return null;
    if (typeof raw === "string") return raw;
    if (typeof raw === "object") {
      const v =
        raw[lang] ||
        raw[i18n.language] ||
        raw.ar ||
        raw.fr ||
        raw.en ||
        Object.values(raw).find((x) => typeof x === "string" && x.trim().length);
      return v || null;
    }
    return null;
  };

  const formatAddress = (address) => {
    if (!address) return "—";
    if (typeof address === "string") return address;

    const parts = [];
    if (address.country) parts.push(address.country);
    if (address.state) parts.push(address.state);
    if (address.city) parts.push(address.city);
    if (address.postalCode) parts.push(address.postalCode);
    if (address.zipcode) parts.push(address.zipcode);
    if (address.street) parts.push(address.street);
    return parts.length ? parts.join(" , ") : "—";
  };

  const computeOrderStatus = (order) => {
    const st = safeText(order?.status);
    if (st && STATUSES.includes(st)) return st;
    return "تم تأكيد الطلب";
  };

  const handleShowDetails = (order) => {
    const createdAt = order.createdAt
      ? new Date(order.createdAt).toLocaleString("ar-TN")
      : "—";
    const fullAddress = formatAddress(order.address);
    const products = Array.isArray(order.products) ? order.products : [];
    const status = computeOrderStatus(order);

    const productsHtml = products
      .map((prod, idx) => {
        const productId = getLinePid(prod) || prod.productId;
        const colorName = pickColorName(prod, lang);
        const embName = embroideryText(prod);

        const unitPrice =
          prod.price || prod.unitPrice || prod.productId?.price || 0;
        const qty = Number(prod.quantity || 1);
        const lineTotal = Number(unitPrice) * qty;

        return `
          <div style="text-align:right; margin-bottom:8px; direction:rtl;">
            <strong>المنتج ${idx + 1} :</strong><br/>
            <strong>ID :</strong> ${
              productId ? String(productId).slice(0, 12) : "N/A"
            }<br/>
            <strong>الكمية :</strong> ${qty}<br/>
            <strong>السعر للوحدة :</strong> ${unitPrice} TND<br/>
            <strong>إجمالي السطر :</strong> ${lineTotal} TND<br/>
            <strong>اللون :</strong> ${colorName}<br/>
            ${embName ? `<strong>نوع التطريز :</strong> ${embName}<br/>` : ""}
          </div>
        `;
      })
      .join("<hr/>");

    Swal.fire({
      title: "تفاصيل الطلب",
      html: `
        <div style="text-align:right; direction:rtl;">
          <p><strong>ID الطلب :</strong> <span style="direction:ltr; display:inline-block;">${order._id}</span></p>
          <p><strong>حالة الطلب :</strong> ${status}</p>
          <p><strong>الاسم :</strong> ${order.name || "-"}</p>
          <p><strong>البريد :</strong> <span style="direction:ltr; display:inline-block;">${order.email || "-"}</span></p>
          <p><strong>الهاتف :</strong> <span style="direction:ltr; display:inline-block;">${order.phone || "-"}</span></p>
          <p><strong>العنوان :</strong> ${fullAddress}</p>
          <p><strong>السعر الإجمالي :</strong> ${
            order.totalPrice ?? order?.totals?.total ?? "-"
          } TND</p>
          <p><strong>تاريخ الإنشاء :</strong> ${createdAt}</p>
          <hr/>
          <h3 style="font-size:15px; margin-top:10px; margin-bottom:6px;">المنتجات :</h3>
          ${productsHtml || "<p>لا يوجد منتجات مسجلة.</p>"}
        </div>
      `,
      width: 760,
      confirmButtonText: "إغلاق",
    });
  };

  const sortedOrders = useMemo(
    () =>
      [...orders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [orders]
  );

  const applyStatusInstant = async (order, selectedStatus) => {
    const orderId = order?._id;
    if (!orderId) return;

    const selected = safeText(selectedStatus);
    if (!STATUSES.includes(selected)) return;

    setUiStatus((prev) => ({ ...prev, [orderId]: selected }));
    setSavingMap((prev) => ({ ...prev, [orderId]: true }));

    try {
      const delivered = selected === "تم التسليم والدفع";

      await updateOrder({
        orderId,
        status: selected,
        isDelivered: delivered,
        isPaid: delivered,
      }).unwrap();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "تم تحديث حالة الطلب",
        showConfirmButton: false,
        timer: 900,
      });

      refetch?.();
    } catch (e) {
      setUiStatus((prev) => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });

      const msg =
        e?.data?.message ||
        e?.error ||
        e?.message ||
        "فشل تحديث الطلب. تحقق من السيرفر.";

      Swal.fire("خطأ", msg, "error");
    } finally {
      setSavingMap((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleDelete = async (orderId) => {
    Swal.fire({
      title: "هل أنت متأكد؟",
      text: "لن تتمكن من التراجع بعد الحذف",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "نعم، احذف الطلب",
      cancelButtonText: "إلغاء",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        await deleteOrder(orderId).unwrap();
        Swal.fire("تم الحذف", "تم حذف الطلب بنجاح", "success");
        refetch?.();
      } catch (err) {
        const msg =
          err?.data?.message ||
          err?.error ||
          err?.message ||
          "فشل حذف الطلب، حاول مرة أخرى";
        Swal.fire("خطأ", msg, "error");
      }
    });
  };

  useEffect(() => {
    document.documentElement.dir = "rtl";
  }, []);

  if (isLoading)
    return (
      <div className="wz-amo__loading" dir="rtl">
        <p>جاري تحميل الطلبات...</p>
      </div>
    );

  if (error)
    return (
      <div className="wz-amo__error" dir="rtl">
        فشل تحميل الطلبات، حاول لاحقاً
      </div>
    );

  return (
    <section className="wz-amo" dir="rtl" lang="ar">
      <div className="wz-amo__container">
        <header className="wz-amo__header">
          <h3 className="wz-amo__title">كلّ الطلبات</h3>

          <button
            type="button"
            className="wz-amo__btn wz-amo__btn--ghost"
            onClick={() => refetch?.()}
            title="تحديث القائمة"
          >
            تجديد
          </button>
        </header>

        <div className="wz-amo__tableWrap">
          <table className="wz-amo__table">
            <thead>
              <tr>
                <th>#</th>
                <th>رقم الطلب</th>
                <th>المنتجات</th>
                <th>العميل</th>
                <th>البريد</th>
                <th>الهاتف</th>
                <th>العنوان</th>
                <th>السعر الإجمالي</th>
                <th>تقدّم الطلب</th>
                <th>الإجراءات</th>
              </tr>
            </thead>

            <tbody>
              {sortedOrders.map((order, index) => {
                const products = Array.isArray(order.products) ? order.products : [];
                const computed = computeOrderStatus(order);
                const current = uiStatus?.[order._id] ?? computed;
                const saving = !!savingMap?.[order._id];

                return (
                  <tr key={`${order._id}-${index}`}>
                    <td className="wz-amo__mono">{index + 1}</td>

                    <td className="wz-amo__col-order" title={order._id}>
                      <div className="wz-amo__orderCell">
                        <div className="wz-amo__mono wz-amo__ltr">
                          {order._id?.slice(0, 8)}...
                        </div>

                        {order.orderId ? (
                          <div className="wz-amo__sub">
                            <span className="wz-amo__subLabel">ID تتبّع:</span>{" "}
                            <span className="wz-amo__mono wz-amo__ltr">{order.orderId}</span>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td className="wz-amo__products">
                      {products.length ? (
                        products.map((prod, lineIndex) => {
                          const productId = getLinePid(prod);
                          const colorName = pickColorName(prod, lang);
                          const embName = embroideryText(prod);
                          const unitPrice =
                            prod.price || prod.unitPrice || prod.productId?.price || 0;
                          const qty = Math.max(1, Number(prod.quantity || 1));
                          const colorImage = prod?.color?.image;

                          const imgSrc = colorImage ? getImgUrl(colorImage) : "";

                          return (
                            <div
                              key={`${productId || "noid"}-${lineIndex}`}
                              className="wz-amo__product"
                            >
                              <div className="wz-amo__productInfo">
                                <div className="wz-amo__line">
                                  <span className="wz-amo__k">ID:</span>
                                  <span className="wz-amo__v wz-amo__mono wz-amo__ltr">
                                    {productId ? String(productId).slice(0, 8) : "N/A"}
                                  </span>
                                </div>

                                <div className="wz-amo__line">
                                  <span className="wz-amo__k">الكمية:</span>
                                  <span className="wz-amo__v">{qty}</span>
                                </div>

                                <div className="wz-amo__line">
                                  <span className="wz-amo__k">السعر للوحدة:</span>
                                  <span className="wz-amo__v wz-amo__mono wz-amo__ltr">
                                    {unitPrice} TND
                                  </span>
                                </div>

                                <div className="wz-amo__line">
                                  <span className="wz-amo__k">اللون:</span>
                                  <span className="wz-amo__v">{colorName}</span>
                                </div>

                                {embName ? (
                                  <div className="wz-amo__line">
                                    <span className="wz-amo__k">التطريز:</span>
                                    <span className="wz-amo__v">{embName}</span>
                                  </div>
                                ) : null}
                              </div>

                              <div className="wz-amo__thumb">
                                {imgSrc ? (
                                  <a
                                    className="wz-amo__imgLink"
                                    href={imgSrc}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="فتح الصورة في تبويب جديد"
                                  >
                                    <img
                                      src={imgSrc}
                                      alt="لون المنتج"
                                      className="wz-amo__img"
                                      loading="lazy"
                                    />
                                  </a>
                                ) : (
                                  <div className="wz-amo__img wz-amo__img--empty">
                                    لا توجد صورة
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <span className="wz-amo__muted">لا توجد منتجات</span>
                      )}
                    </td>

                    <td>{order.name || "—"}</td>
                    <td className="wz-amo__mono wz-amo__ltr">{order.email || "—"}</td>
                    <td className="wz-amo__mono wz-amo__ltr">{order.phone || "—"}</td>
                    <td className="wz-amo__addr">{formatAddress(order.address)}</td>

                    <td className="wz-amo__mono wz-amo__ltr">
                      {(order.totalPrice ?? order?.totals?.total ?? 0)} TND
                    </td>

                    <td>
                      <select
                        className="wz-amo__select"
                        value={current}
                        disabled={saving}
                        onChange={(e) => applyStatusInstant(order, e.target.value)}
                        title={saving ? "جاري الحفظ..." : "غيّر حالة الطلب"}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

                      <div className="wz-amo__hint">
                        هذه الحالة تخص <strong>الطلب بالكامل</strong>.
                        {saving ? <span className="wz-amo__saving"> — جاري الحفظ…</span> : null}
                      </div>
                    </td>

                    <td>
                      <div className="wz-amo__actions">
                        <button
                          onClick={() => handleShowDetails(order)}
                          className="wz-amo__btn wz-amo__btn--dark"
                        >
                          تفاصيل
                        </button>

                        <button
                          onClick={() => handleDelete(order._id)}
                          className="wz-amo__btn wz-amo__btn--danger"
                        >
                          حذف
                        </button>
                      </div>
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