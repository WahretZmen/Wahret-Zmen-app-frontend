// src/pages/OrderConfirm.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  CheckCircle,
  Package,
  Truck,
  ArrowLeft,
  Copy,
  Banknote,
  ShieldCheck,
  User,
  Phone,
  Mail,
  MapPin,
  Image as ImageIcon,
  Search,
  Loader2,
  RefreshCw,
} from "lucide-react";

import Header from "../components/ui/Header.jsx";
import Footer from "../components/ui/Footer.jsx";

import getBaseUrl from "../utils/baseURL";
import { getImgUrl } from "../utils/getImgUrl";
import "../Styles/StylesOrderConfirm.css";

/* -----------------------
   Helpers
------------------------ */
const STATUSES = [
  "تم تأكيد الطلب",
  "قيد التحضير",
  "خارج للتسليم",
  "تم التسليم والدفع",
];

const safeMoney = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(2) : "0.00";
};

const safeText = (v) => (typeof v === "string" ? v.trim() : String(v ?? "").trim());

const makeFallbackId = () =>
  "WZ-2026-" + Math.random().toString(36).substring(2, 8).toUpperCase();

const statusIndex = (s) => {
  const i = STATUSES.indexOf(String(s || "").trim());
  return i < 0 ? 0 : i;
};

const percentOfStatus = (s) => {
  const i = statusIndex(s);
  return Math.round(((i + 1) / STATUSES.length) * 100);
};

const getProgressObj = (order) => {
  const p = order?.productProgress;
  if (!p) return {};
  if (typeof p.get === "function") {
    const obj = {};
    for (const [k, v] of p.entries()) obj[k] = v;
    return obj;
  }
  return typeof p === "object" ? p : {};
};

const readStoredOrder = (orderId) => {
  try {
    const byId = sessionStorage.getItem(`wz_order_${String(orderId)}`);
    if (byId) return JSON.parse(byId);

    const last = sessionStorage.getItem("wz_last_order");
    if (!last) return null;
    const parsed = JSON.parse(last);
    const storedId = safeText(parsed?.orderId);
    if (storedId && safeText(orderId) && storedId !== safeText(orderId)) return null;
    return parsed?.order || null;
  } catch (_) {
    return null;
  }
};

const persistOrderSnapshot = (id, order) => {
  const v = safeText(id);
  if (!v || !order) return;
  try {
    sessionStorage.setItem(
      "wz_last_order",
      JSON.stringify({ orderId: v, order, savedAt: Date.now() })
    );
  } catch (_) {}
  try {
    sessionStorage.setItem(`wz_order_${v}`, JSON.stringify(order));
  } catch (_) {}
};

const pickLineImageRaw = (line) => {
  const colorImgs = Array.isArray(line?.color?.images) ? line.color.images.filter(Boolean) : [];
  const prod = line?.productData || line?.productId || line?.product || {};
  return (
    line?.color?.image ||
    colorImgs[0] ||
    prod?.coverImage ||
    prod?.image ||
    prod?.thumbnail ||
    line?.image ||
    line?.coverImage ||
    ""
  );
};

const pickLineImage = (line) => {
  const raw = pickLineImageRaw(line);
  return raw ? getImgUrl(raw) : "";
};

const pickTitle = (line) => {
  const prod = line?.productData || line?.productId || line?.product || {};
  return (
    prod?.translations?.ar?.title ||
    prod?.translations?.fr?.title ||
    prod?.translations?.en?.title ||
    prod?.title ||
    line?.title ||
    "منتج"
  );
};

const pickColorName = (line) => {
  const cn = line?.color?.colorName ?? line?.colorName;
  if (!cn) return "";
  if (typeof cn === "string") return cn.trim();
  if (typeof cn === "object") return (cn.ar || cn.fr || cn.en || "").trim();
  return "";
};

const pickSize = (line) => safeText(line?.size || line?.selectedSize || "");

const getPid = (line) => {
  if (typeof line?.productId === "string") return safeText(line.productId);
  if (typeof line?.productData?.productId === "string") return safeText(line.productData.productId);
  if (typeof line?.product?.productId === "string") return safeText(line.product.productId);
  return "";
};

const pickCategory = (line) =>
  safeText(line?.productData?.category || line?.productId?.category || line?.product?.category || "");

const pickSubCategory = (line) =>
  safeText(
    line?.productData?.subCategory || line?.productId?.subCategory || line?.product?.subCategory || ""
  );

/* -----------------------
   ✅ Stable progress key
------------------------ */
const normalizeKeyPart = (s) =>
  safeText(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const getStableColorKeyPart = (line) => {
  const ck = safeText(line?.colorKey);
  if (ck) return `ck:${ck}`;

  const rawImg = safeText(line?.color?.image) || safeText(pickLineImageRaw(line));
  if (rawImg) return `img:${rawImg}`;

  const name = normalizeKeyPart(pickColorName(line));
  return `name:${name || "original"}`;
};

const buildProgressKey = (line, lineIndex, itemIndex) => {
  const pid = getPid(line) || "noid";
  const colorPart = getStableColorKeyPart(line);
  return `${pid}|${colorPart}|${lineIndex}-${itemIndex}`;
};

/* ========================================================================== */
export default function OrderConfirm() {
  const { orderId: orderIdParam } = useParams();
  const location = useLocation();

  const [copied, setCopied] = useState(false);

  const [serverLoading, setServerLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(0);

  const initialOrder = location.state?.order || readStoredOrder(orderIdParam) || null;
  const [order, setOrder] = useState(initialOrder);

  const ref =
    location.state?.orderId ||
    orderIdParam ||
    order?.orderId ||
    order?._id ||
    makeFallbackId();

  const LTR = ({ children, className = "" }) => (
    <span dir="ltr" className={className} style={{ unicodeBidi: "plaintext", direction: "ltr" }}>
      {children}
    </span>
  );

  const fetchOrderByTrackId = async (trackId) => {
    const v = safeText(trackId);
    if (!v) return null;

    const rawBase = String(getBaseUrl() || "").trim().replace(/\/$/, "");
    const url = `${rawBase}/api/orders/track/${encodeURIComponent(v)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      let msg = "تعذّر جلب بيانات الطلب.";
      try {
        const data = await res.json();
        msg = data?.message || msg;
      } catch (_) {}
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }

    return await res.json();
  };

  const revalidate = async () => {
    const v = safeText(ref);
    if (!v) return;

    setServerError("");
    setServerLoading(true);
    try {
      const data = await fetchOrderByTrackId(v);
      setOrder(data);
      persistOrderSnapshot(v, data);
      setLastUpdatedAt(Date.now());
    } catch (e) {
      setServerError(e?.message || "تعذّر تحديث بيانات الطلب من السيرفر.");
    } finally {
      setServerLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!alive) return;
      await revalidate();
    };

    run();

    const t = setInterval(() => {
      if (!alive) return;
      revalidate();
    }, 5000);

    return () => {
      alive = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  const lines = useMemo(() => (Array.isArray(order?.products) ? order.products : []), [order]);

  const totals = useMemo(() => {
    const subtotal = order?.totals?.subtotal ?? order?.subtotal ?? 0;
    const shipping = order?.totals?.shipping ?? order?.shipping ?? 0;
    const total = order?.totals?.total ?? order?.totalPrice ?? order?.total ?? 0;
    return { subtotal, shipping, total };
  }, [order]);

  const guest = useMemo(() => {
    const addr = order?.address || {};
    const fullName =
      safeText(order?.name || `${order?.firstName || ""} ${order?.lastName || ""}`) || "—";
    const email = safeText(order?.email) || "—";
    const phone = safeText(order?.phone) || "—";

    const street = safeText(addr?.street) || safeText(addr?.address) || "";
    const city = safeText(addr?.city) || "";
    const state = safeText(addr?.state) || "";
    const zipcode = safeText(addr?.zipcode || addr?.postal || addr?.postalCode) || "";
    const country = safeText(addr?.country) || "Tunisia";

    const addressLine = [street, city, state, zipcode, country].filter(Boolean).join("، ");
    return { fullName, email, phone, addressLine: addressLine || "—" };
  }, [order]);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(String(ref || ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  const progressMap = useMemo(() => getProgressObj(order), [order]);

  const hasAnyPieceProgress = useMemo(
    () => Object.keys(progressMap || {}).length > 0,
    [progressMap]
  );

  const orderStatus = useMemo(() => {
    const s = safeText(order?.status);
    return STATUSES.includes(s) ? s : "تم تأكيد الطلب";
  }, [order]);

  const pieces = useMemo(() => {
    const out = [];
    lines.forEach((line, lineIndex) => {
      const qty = Math.max(1, Number(line?.quantity || 1));
      for (let itemIndex = 0; itemIndex < qty; itemIndex++) {
        const key = buildProgressKey(line, lineIndex, itemIndex);
        const st = safeText(progressMap?.[key]) || "تم تأكيد الطلب";
        const pct = percentOfStatus(st);

        out.push({
          key,
          status: STATUSES.includes(st) ? st : "تم تأكيد الطلب",
          pct,
          lineIndex,
          itemIndex,
        });
      }
    });
    return out;
  }, [lines, progressMap]);

  const globalPctPieces = useMemo(() => {
    if (!pieces.length) return 0;
    const sum = pieces.reduce((acc, it) => acc + (it.pct || 0), 0);
    return Math.round(sum / pieces.length);
  }, [pieces]);

  const globalPct = hasAnyPieceProgress ? globalPctPieces : percentOfStatus(orderStatus);

  const completedSteps = useMemo(() => {
    const doneCount = Math.floor((globalPct / 100) * STATUSES.length);
    return Math.max(1, Math.min(STATUSES.length, doneCount));
  }, [globalPct]);

  const progressPercent = useMemo(() => (completedSteps / STATUSES.length) * 100, [completedSteps]);

  const steps = useMemo(
    () => [
      { icon: CheckCircle, title: "تم تأكيد الطلب", desc: "تم استلام طلبك وتأكيده بنجاح." },
      { icon: Package, title: "قيد التحضير", desc: "سيقوم فريقنا بتجهيز المنتج بعناية وتغليفه." },
      { icon: Truck, title: "خارج للتسليم", desc: "طلبك في الطريق إليك مع شركة التوصيل." },
      { icon: Banknote, title: "تم التسليم والدفع", desc: "تم التسليم والدفع عند الاستلام." },
    ],
    []
  );

  return (
    <div className="wz-oc" dir="rtl" lang="ar">
      <Header />

      <main className="wz-oc__main">
        <div className="wz-oc__container">
          <header className="wz-oc__hero wz-anim">
            <div className="wz-oc__badge">
              <CheckCircle size={38} />
            </div>

            <h1 className="wz-oc__title">تم تأكيد الطلب!</h1>
            <p className="wz-oc__sub">
              شكرًا لطلبك. احتفظ بمرجع الطلب لأنك ستستخدمه لتتبّع الطلب في أي وقت.
            </p>
          </header>

          {/* ID card */}
          <section className="wz-oc__card wz-oc__card--soft wz-anim wz-anim--d1">
            <div className="wz-oc__cardBody wz-oc__idRow">
              <div>
                <div className="wz-oc__muted">مرجع الطلب</div>
                <div className="wz-oc__ref" style={{ direction: "ltr", unicodeBidi: "plaintext" }}>
                  {ref}
                </div>
              </div>

              <div className="wz-oc__idRight">
                <div className="wz-oc__pill">
                  <Banknote size={14} />
                  الدفع عند الاستلام
                </div>

                <button
                  className="wz-oc__iconBtn"
                  onClick={copyId}
                  type="button"
                  aria-label="نسخ رقم الطلب"
                  title="نسخ رقم الطلب"
                >
                  <Copy size={18} />
                </button>

                <button
                  className="wz-oc__iconBtn"
                  onClick={revalidate}
                  type="button"
                  aria-label="تحديث الحالة"
                  title="تحديث الحالة"
                  style={{ marginInlineStart: 8 }}
                  disabled={serverLoading}
                >
                  {serverLoading ? <Loader2 size={18} className="wz-oc__spin" /> : <RefreshCw size={18} />}
                </button>
              </div>
            </div>

            {copied ? <div className="wz-oc__toast">تم النسخ!</div> : null}

            {(serverLoading || serverError || lastUpdatedAt) && (
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9 }}>
                {serverError ? (
                  <span style={{ color: "#b91c1c" }}>{serverError}</span>
                ) : (
                  <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                    {serverLoading ? <Loader2 size={14} className="wz-oc__spin" /> : null}
                    {lastUpdatedAt ? <span style={{ opacity: 0.75 }}></span> : null}
                  </span>
                )}
              </div>
            )}
          </section>

          {/* Progress summary */}
          <section className="wz-oc__card wz-anim wz-anim--d1">
            <div className="wz-oc__cardBody wz-oc__cardBody--lg">
              <div
                className="wz-oc__bar"
                role="progressbar"
                aria-valuenow={Math.round(progressPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{ marginTop: 10 }}
              >
                <div className="wz-oc__barFill" style={{ width: `${progressPercent}%` }} />
              </div>

              <div style={{ marginTop: 10, fontSize: 13 }}>
                <span className="wz-oc__muted2">حالة الطلب الحالية : </span>
                <strong>{orderStatus}</strong>
              </div>

              {hasAnyPieceProgress && pieces.length ? (
                <div style={{ marginTop: 12 }}>
                  <div className="wz-oc__muted2" style={{ marginBottom: 8 }}>
                    تقدّم القطع:
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    {pieces.slice(0, 12).map((p, idx) => (
                      <div
                        key={p.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          border: "1px solid rgba(0,0,0,.08)",
                          background: "rgba(255,255,255,.85)",
                          padding: 10,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <span style={{ fontWeight: 900 }}>#{idx + 1}</span>
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {p.status}
                          </span>
                        </div>

                        <div style={{ fontSize: 12, opacity: 0.85, direction: "ltr" }}>{p.pct}%</div>
                      </div>
                    ))}

                    {pieces.length > 12 ? (
                      <div style={{ fontSize: 12, opacity: 0.8 }}>
                        يتم عرض أول 12 قطعة فقط… (الإجمالي: {pieces.length})
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* Guide */}
          <section className="wz-oc__card wz-oc__card--guide wz-anim wz-anim--d1">
            <div className="wz-oc__cardBody wz-oc__cardBody--lg">
              <div className="wz-oc__guideHead">
                <div className="wz-oc__guideIcon">
                  <Search size={18} />
                </div>
                <div className="wz-oc__guideText">
                  <h2 className="wz-oc__sectionTitle wz-oc__sectionTitle--tight">
                    كيف تتبّع طلبك بسهولة؟
                  </h2>
                  <p className="wz-oc__guideSub">
                    اتّبع هذه الخطوات البسيطة — وسترى حالة الطلب والمنتجات ومعلومات التوصيل.
                  </p>
                </div>
              </div>

              <div className="wz-oc__guideSteps">
                <div className="wz-oc__gStep">
                  <div className="wz-oc__gNum">1</div>
                  <div className="wz-oc__gStepBody">
                    <div className="wz-oc__gStepTitle">انسخ مرجع الطلب</div>
                    <div className="wz-oc__gStepDesc">اضغط زر النسخ بجانب المرجع لتجنّب أي خطأ.</div>
                  </div>
                </div>

                <div className="wz-oc__gStep">
                  <div className="wz-oc__gNum">2</div>
                  <div className="wz-oc__gStepBody">
                    <div className="wz-oc__gStepTitle">افتح صفحة التتبّع</div>
                    <div className="wz-oc__gStepDesc">اضغط “تتبّع الطلب الآن” للانتقال مباشرةً لصفحة التتبّع.</div>
                  </div>
                </div>

                <div className="wz-oc__gStep">
                  <div className="wz-oc__gNum">3</div>
                  <div className="wz-oc__gStepBody">
                    <div className="wz-oc__gStepTitle">الصق المرجع واضغط “تتبّع”</div>
                    <div className="wz-oc__gStepDesc">إذا لم يتم فتح الطلب تلقائيًا، الصق المرجع ثم اضغط زر “تتبّع”.</div>
                  </div>
                </div>
              </div>

              <div className="wz-oc__guideCtas">
                <Link to={`/order-track/${ref}`} state={{ order }} className="wz-oc__actionLink wz-oc__actionLink--wide">
                  <button className="wz-oc__btn wz-oc__btn--primary" type="button">
                    تتبّع الطلب الآن <ArrowLeft size={16} />
                  </button>
                </Link>

                <button className="wz-oc__btn wz-oc__btn--outline" type="button" onClick={copyId}>
                  نسخ مرجع الطلب <Copy size={16} />
                </button>
              </div>

              <div className="wz-oc__guideHint">
                <span className="wz-oc__guideHintStrong">مهم:</span> احتفظ بمرجع الطلب (Screenshot أو كتابة) لأنك
                ستحتاجه لاحقًا للتتبّع أو عند التواصل مع الدعم.
              </div>
            </div>
          </section>

          {/* Guest Details */}
          <section className="wz-oc__card wz-anim wz-anim--d1">
            <div className="wz-oc__cardBody wz-oc__cardBody--lg">
              <h2 className="wz-oc__sectionTitle">معلومات الزبون</h2>

              <div className="wz-oc__guestGrid">
                <div className="wz-oc__guestItem">
                  <span className="wz-oc__gIcon">
                    <User size={16} />
                  </span>
                  <div className="wz-oc__gBody">
                    <div className="wz-oc__gLabel">الاسم</div>
                    <div className="wz-oc__gValue">{guest.fullName}</div>
                  </div>
                </div>

                <div className="wz-oc__guestItem">
                  <span className="wz-oc__gIcon">
                    <Phone size={16} />
                  </span>
                  <div className="wz-oc__gBody">
                    <div className="wz-oc__gLabel">الهاتف</div>
                    <div className="wz-oc__gValue" style={{ direction: "ltr", unicodeBidi: "plaintext" }}>
                      {guest.phone}
                    </div>
                  </div>
                </div>

                <div className="wz-oc__guestItem">
                  <span className="wz-oc__gIcon">
                    <Mail size={16} />
                  </span>
                  <div className="wz-oc__gBody">
                    <div className="wz-oc__gLabel">البريد الإلكتروني</div>
                    <div className="wz-oc__gValue">{guest.email}</div>
                  </div>
                </div>

                <div className="wz-oc__guestItem wz-oc__guestItem--full">
                  <span className="wz-oc__gIcon">
                    <MapPin size={16} />
                  </span>
                  <div className="wz-oc__gBody">
                    <div className="wz-oc__gLabel">عنوان الشحن</div>
                    <div className="wz-oc__gValue">{guest.addressLine}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Ordered Products */}
          <section className="wz-oc__card wz-anim wz-anim--d3">
            <div className="wz-oc__cardBody wz-oc__cardBody--lg">
              <h2 className="wz-oc__sectionTitle">المنتجات المطلوبة</h2>

              {lines.length ? (
                <div className="wz-oc__plist">
                  {lines.map((line, idx) => {
                    const title = pickTitle(line);
                    const qty = Math.max(1, Number(line?.quantity || 1));
                    const size = pickSize(line);
                    const colorName = pickColorName(line);
                    const pid = getPid(line);
                    const category = pickCategory(line);
                    const subCategory = pickSubCategory(line);
                    const src = pickLineImage(line);

                    return (
                      <div className="wz-oc__pitem" key={line?._id || `${ref}-${idx}`}>
                        <div className="wz-oc__pThumb" aria-hidden="true">
                          {src ? (
                            <img className="wz-oc__pImg" src={src} alt={title} loading="lazy" decoding="async" />
                          ) : (
                            <div className="wz-oc__pFallback" title="لا توجد صورة">
                              <ImageIcon size={18} />
                            </div>
                          )}
                        </div>

                        <div className="wz-oc__pMain">
                          <div className="wz-oc__pTop">
                            <div className="wz-oc__pTitle" title={title}>
                              {title}
                            </div>
                          </div>

                          <div className="wz-oc__pMeta" style={{ display: "grid", gap: 4 }}>
                            {pid ? <span>Product ID: {pid}</span> : null}
                            {category ? <span>Category: {category}</span> : null}
                            {subCategory ? <span>Sub category: {subCategory}</span> : null}
                            {colorName ? <span>اللون: {colorName}</span> : null}
                            {size ? <span>المقاس: {size}</span> : null}
                            <span>الكمية: {qty}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="wz-oc__empty">لا توجد تفاصيل للمنتجات داخل التأكيد.</div>
              )}
            </div>
          </section>

          {/* Note */}
          <section className="wz-oc__card wz-oc__card--note wz-anim wz-anim--d1">
            <div className="wz-oc__cardBody wz-oc__noteRow">
              <div className="wz-oc__noteIcon">
                <ShieldCheck size={20} />
              </div>

              <div className="wz-oc__noteText">
                <div className="wz-oc__noteTitle">لا يوجد دفع الآن</div>
                <div className="wz-oc__noteDesc">
                  ستدفع  نقدًا عند توصيل الطلب.
                </div>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="wz-oc__card wz-anim wz-anim--d2">
            <div className="wz-oc__cardBody wz-oc__cardBody--lg">
              <h2 className="wz-oc__sectionTitle">ماذا سيحدث بعد ذلك؟</h2>

              <div className="wz-oc__timeline">
                {steps.map((s, i) => {
                  const Icon = s.icon;
                  const last = i === steps.length - 1;
                  const done = i < completedSteps;

                  return (
                    <div className="wz-oc__step" key={i}>
                      <div className="wz-oc__stepLeft">
                        <div className={`wz-oc__dot ${done ? "is-active" : ""}`}>
                          <Icon size={18} />
                        </div>
                        {!last ? <div className={`wz-oc__line ${done ? "is-active" : ""}`} /> : null}
                      </div>

                      <div className="wz-oc__stepBody">
                        <div className={`wz-oc__stepTitle ${done ? "is-active" : ""}`}>{s.title}</div>
                        <div className="wz-oc__stepDesc">{s.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 12, fontSize: 13, opacity: 0.9 }}>
                <span className="wz-oc__muted2">حالة الطلب (Admin): </span>
                <strong>{orderStatus}</strong>
              </div>
            </div>
          </section>

          {/* Totals */}
          <section className="wz-oc__card wz-anim wz-anim--d3">
            <div className="wz-oc__cardBody wz-oc__cardBody--lg">
              <h2 className="wz-oc__sectionTitle">ملخص المبلغ</h2>

              <div className="wz-oc__summary">
                

                <div className="wz-oc__sumRow wz-oc__sumRow--sm">
                  <span className="wz-oc__muted2">التوصيل</span>
                  <span className={Number(totals.shipping) === 0 ? "wz-oc__green" : ""}>
                    {Number(totals.shipping) === 0 ? "مجاني" : `${safeMoney(totals.shipping)} د.ت`}
                  </span>
                </div>

                <div className="wz-oc__sumRow wz-oc__sumRow--sm">
                  <span className="wz-oc__muted2">طريقة الدفع</span>
                  <span className="wz-oc__pay">
                    <Banknote size={14} /> الدفع عند الاستلام
                  </span>
                </div>

                <div className="wz-oc__sep" />

                
              </div>
            </div>
          </section>

          {/* Actions */}
          <section className="wz-oc__actions wz-anim wz-anim--d3">
            <Link to={`/order-track/${ref}`} state={{ order }} className="wz-oc__actionLink">
              <button className="wz-oc__btn wz-oc__btn--primary" type="button">
                تتبّع الطلب <ArrowLeft size={16} />
              </button>
            </Link>

            <Link to="/" className="wz-oc__actionLink">
              <button className="wz-oc__btn wz-oc__btn--outline" type="button">
                مواصلة التسوق
              </button>
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}