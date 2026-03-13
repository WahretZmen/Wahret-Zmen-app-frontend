// src/pages/OrderTrack.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import {
  Search,
  CheckCircle,
  Package,
  Truck,
  Banknote,
  Phone,
  Mail,
  MessageCircle,
  ShieldCheck,
  Loader2,
  Image as ImageIcon,
  Copy,
  ArrowLeft,
} from "lucide-react";

import Header from "../components/ui/Header.jsx";
import Footer from "../components/ui/Footer.jsx";

import getBaseUrl from "../utils/baseURL";
import { getImgUrl } from "../utils/getImgUrl";
import "../Styles/StylesOrderSuccess.css";


const STATUSES = [
  "تم تأكيد الطلب",
  "قيد التحضير",
  "خارج للتسليم",
  "تم التسليم والدفع",
];

const makeFallbackId = () =>
  "WZ-2026-" + Math.random().toString(36).substring(2, 8).toUpperCase();

const safeText = (v) => (typeof v === "string" ? v.trim() : String(v ?? "").trim());

const money = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(2) : "0.00";
};

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

/* -----------------------
   Robust product pickers
------------------------ */
const pickLineImageRaw = (line) => {
  const colorImgs = Array.isArray(line?.color?.images) ? line.color.images.filter(Boolean) : [];
  const prod = line?.productId || line?.product || {};
  return (
    line?.color?.image ||
    colorImgs[0] ||
    prod?.coverImage ||
    prod?.image ||
    prod?.thumbnail ||
    line?.image ||
    ""
  );
};

const pickLineImage = (line) => {
  const raw = pickLineImageRaw(line);
  return raw ? getImgUrl(raw) : "";
};

const pickTitle = (line) => {
  const prod = line?.productId || line?.product || {};
  return (
    prod?.translations?.ar?.title ||
    prod?.translations?.fr?.title ||
    prod?.translations?.en?.title ||
    prod?.title ||
    line?.translations?.ar?.title ||
    line?.title ||
    "منتج"
  );
};

const pickColorName = (line) => {
  const cn = line?.color?.colorName ?? line?.colorName;
  if (!cn) return "أصلي";
  if (typeof cn === "string") return cn.trim() || "أصلي";
  if (typeof cn === "object") return (cn.ar || cn.fr || cn.en || "").trim() || "أصلي";
  return "أصلي";
};

const pickSize = (line) => safeText(line?.size || line?.selectedSize || "");

const getPid = (line) =>
  typeof line?.productId === "string" ? line.productId : line?.productId?._id || line?.product?._id || "";

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

// Timeline seed (UI)
const trackingStepsSeed = [
  { icon: CheckCircle, label: "تم تأكيد الطلب", date: "—", desc: "تم استلام طلبك وتأكيده بنجاح", done: false },
  { icon: Package, label: "قيد التحضير", date: "—", desc: "حرفيّونا يقومون بتجهيز الطلب بعناية", done: false },
  { icon: Truck, label: "خارج للتسليم", date: "—", desc: "طلبك في الطريق إليك", done: false },
  { icon: Banknote, label: "تم التسليم والدفع", date: "—", desc: "الدفع نقدًا عند الاستلام", done: false },
];

/* -----------------------
   Helpers for storage
------------------------ */
const readAnyStoredOrder = (id) => {
  const v = safeText(id);
  if (!v) return null;

  try {
    const byId = sessionStorage.getItem(`wz_order_${v}`);
    if (byId) return JSON.parse(byId);
  } catch (_) {}

  try {
    const raw = sessionStorage.getItem("wz_last_order");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const storedId = safeText(parsed?.orderId);
    if (storedId && storedId !== v) return null;
    return parsed?.order || null;
  } catch (_) {
    return null;
  }
};

const persistOrderSnapshot = (id, order) => {
  const v = safeText(id);
  if (!v || !order) return;
  try {
    sessionStorage.setItem("wz_last_order", JSON.stringify({ orderId: v, order, savedAt: Date.now() }));
  } catch (_) {}
  try {
    sessionStorage.setItem(`wz_order_${v}`, JSON.stringify(order));
  } catch (_) {}
};

export default function OrderTrack() {
  const { orderId } = useParams();
  const location = useLocation();

  const [trackingId, setTrackingId] = useState(orderId || "");
  const [hasSearched, setHasSearched] = useState(Boolean(orderId));
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const [copied, setCopied] = useState(false);

  // ✅ silent refresh indicator (doesn't block UI)
  const [silentRefreshing, setSilentRefreshing] = useState(false);
  const pollRef = useRef(null);

  const effectiveId = safeText(trackingId) || orderId || makeFallbackId();

  useEffect(() => {
    document.documentElement.dir = "rtl";
  }, []);

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
      let msg = "تعذّر العثور على الطلب.";
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

  const applyOrderIfChanged = (next, trackId) => {
    if (!next) return;

    // compare only important stuff to avoid re-render spam
    const prev = order;
    const prevSig = JSON.stringify({
      status: prev?.status,
      totals: prev?.totals,
      totalPrice: prev?.totalPrice,
      productProgress: prev?.productProgress,
      updatedAt: prev?.updatedAt,
    });

    const nextSig = JSON.stringify({
      status: next?.status,
      totals: next?.totals,
      totalPrice: next?.totalPrice,
      productProgress: next?.productProgress,
      updatedAt: next?.updatedAt,
    });

    if (prevSig !== nextSig) {
      setOrder(next);
      persistOrderSnapshot(trackId, next);
    } else {
      // still persist (optional) to keep last snapshot fresh
      persistOrderSnapshot(trackId, next);
    }
  };

  const runSearch = async (idValue, { silent = false } = {}) => {
    const v = safeText(idValue);

    if (!v) {
      setError("يرجى إدخال مرجع الطلب.");
      setHasSearched(false);
      setOrder(null);
      return;
    }

    setError("");
    setHasSearched(true);

    // 1) state (fast)
    if (!silent) {
      const passed = location.state?.order || null;
      const passedId = safeText(passed?.orderId || passed?._id);
      if (passed && passedId === v) setOrder(passed);
    }

    // 2) storage (fast)
    if (!silent) {
      const stored = readAnyStoredOrder(v);
      const storedId = safeText(stored?.orderId || stored?._id);
      if (stored && storedId === v) setOrder(stored);
    }

    // 3) server revalidate
    if (!silent) setLoading(true);
    else setSilentRefreshing(true);

    try {
      const data = await fetchOrderByTrackId(v);
      applyOrderIfChanged(data, v);
    } catch (e) {
      if (!silent) {
        setOrder(null);
        setError(e?.message || "تعذّر جلب الطلب من السيرفر.");
      }
    } finally {
      if (!silent) setLoading(false);
      else setSilentRefreshing(false);
    }
  };

  const onTrack = (e) => {
    e?.preventDefault?.();
    runSearch(trackingId, { silent: false });
  };

  // Auto-run if orderId exists in URL
  useEffect(() => {
    if (orderId) runSearch(orderId, { silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // ✅ AUTO REFRESH: Poll every 8s when we have an order on screen
  useEffect(() => {
    const id = safeText(effectiveId);
    if (!hasSearched || !id) return;

    // clear old
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(() => {
      // only poll when tab is visible (avoids useless calls)
      if (document.visibilityState === "visible") {
        runSearch(id, { silent: true });
      }
    }, 8000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSearched, effectiveId]);

  const products = useMemo(() => (Array.isArray(order?.products) ? order.products : []), [order]);

  const totals = useMemo(() => {
    const subtotal = order?.totals?.subtotal ?? order?.subtotal ?? 0;
    const shipping = order?.totals?.shipping ?? order?.shipping ?? 0;
    const total = order?.totals?.total ?? order?.totalPrice ?? order?.total ?? 0;
    return { subtotal, shipping, total };
  }, [order]);

  const amountDue = useMemo(() => Number(totals?.total || 0) || 0, [totals]);

  // Order-level status
  const orderStatus = useMemo(() => {
    const s = safeText(order?.status);
    return STATUSES.includes(s) ? s : "تم تأكيد الطلب";
  }, [order]);

  const orderPct = useMemo(() => percentOfStatus(orderStatus), [orderStatus]);

  // Per-piece progress
  const progressMap = useMemo(() => getProgressObj(order), [order]);

  const orderedPieces = useMemo(() => {
    const pieces = [];
    products.forEach((line, lineIndex) => {
      const qty = Math.max(1, Number(line?.quantity || 1));
      for (let itemIndex = 0; itemIndex < qty; itemIndex++) {
        const key = buildProgressKey(line, lineIndex, itemIndex);
        const status = safeText(progressMap?.[key]) || "تم تأكيد الطلب";
        const idx = statusIndex(status);
        const pct = percentOfStatus(status);
        pieces.push({ key, status, statusIdx: idx, pct, lineIndex, itemIndex });
      }
    });
    return pieces;
  }, [products, progressMap]);

  const globalPctPieces = useMemo(() => {
    if (!orderedPieces.length) return 0;
    const sum = orderedPieces.reduce((acc, it) => acc + (it.pct || 0), 0);
    return Math.round(sum / orderedPieces.length);
  }, [orderedPieces]);

  const hasAnyPieceProgress = useMemo(() => Object.keys(progressMap || {}).length > 0, [progressMap]);

  const globalPct = hasAnyPieceProgress ? globalPctPieces : orderPct;

  const steps = useMemo(() => {
    const st = trackingStepsSeed.map((x) => ({ ...x }));
    const doneCount = Math.floor((globalPct / 100) * STATUSES.length);
    for (let i = 0; i < st.length; i++) st[i].done = i < doneCount;
    return st;
  }, [globalPct]);

  const completedSteps = useMemo(() => steps.filter((s) => s.done).length, [steps]);

  const progress = useMemo(() => (steps.length ? (completedSteps / steps.length) * 100 : 0), [
    completedSteps,
    steps.length,
    steps,
  ]);

  const orderedLinesSimple = useMemo(() => {
    return products.map((line, idx) => {
      const title = pickTitle(line);
      const img = pickLineImage(line);
      const color = pickColorName(line);
      const size = pickSize(line);

      const qty = Math.max(1, Number(line?.quantity || 1));
      const unit =
        Number(
          line?.price ??
            line?.unitPrice ??
            line?.newPrice ??
            line?.productId?.newPrice ??
            line?.product?.newPrice ??
            0
        ) || 0;

      return {
        key: line?._id || `${getPid(line) || "line"}-${idx}`,
        title,
        img,
        color,
        size,
        qty,
        unit,
        total: unit * qty,
        colorKey: safeText(line?.colorKey || ""),
      };
    });
  }, [products]);

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(String(effectiveId || ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (_) {}
  };

  return (
    <div className="wz-ot" dir="rtl" lang="ar">
      <Header />

      <main className="wz-ot__main">
        <div className="wz-ot__container">
          <header className="wz-ot__hero wz-ot-anim">
            <div className="wz-ot__heroBadge">
              <Package size={30} />
            </div>
            <h1 className="wz-ot__title">تتبّع طلبك</h1>
            <p className="wz-ot__sub">أدخل مرجع الطلب لعرض الحالة والتفاصيل</p>
          </header>

          {/* Search */}
          <section className="wz-ot__card wz-ot-anim wz-ot-anim--d1">
            <div className="wz-ot__cardBody wz-ot__cardBody--search">
              <form className="wz-ot__search" onSubmit={onTrack}>
                <div className="wz-ot__field">
                  <label className="wz-ot__srOnly" htmlFor="trackId">
                    مرجع الطلب
                  </label>

                  <input
                    id="trackId"
                    className="wz-ot__input"
                    placeholder="مثال: WZ-2026-A3F8KD"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    inputMode="text"
                    autoComplete="off"
                    spellCheck={false}
                    dir="ltr"
                  />
                </div>

                <button
                  className="wz-ot__btn wz-ot__btn--track"
                  type="submit"
                  disabled={loading}
                  aria-busy={loading ? "true" : "false"}
                >
                  {loading ? <Loader2 size={16} className="wz-ot__spin" /> : <Search size={16} />}
                  {loading ? "جاري..." : "تتبّع"}
                </button>
              </form>

              {error ? <div className="wz-ot__alert">{error}</div> : null}
            </div>
          </section>

          {hasSearched && (
            <>
              {/* Progress */}
              <section className="wz-ot__progress wz-ot-anim wz-ot-anim--d2">
                <div className="wz-ot__progTop">
                  <div className="wz-ot__progLeft">
                    <span className="wz-ot__progLabel">تقدّم الطلب</span>

                    <span className="wz-ot__chip">
                      {completedSteps}/{steps.length} مراحل
                    </span>

                    <span className="wz-ot__chip" title="مصدر تقدّم الطلب">
                      {hasAnyPieceProgress ? "حسب القطع" : "حسب حالة الطلب"}
                    </span>

                    {/* ✅ silent refresh badge */}
                    {silentRefreshing ? (
                      <span className="wz-ot__chip" title="تحديث تلقائي">
                        <Loader2 size={14} className="wz-ot__spin" /> تحديث…
                      </span>
                    ) : null}
                  </div>

                  <span className="wz-ot__pct">{Math.round(progress)}%</span>
                </div>

                <div
                  className="wz-ot__bar"
                  role="progressbar"
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="wz-ot__barFill" style={{ width: `${progress}%` }} />
                </div>

                {/* Reference row */}
                <div className="wz-ot__trackRef" style={{ marginTop: 10 }}>
                  <span className="wz-ot__muted">مرجع الطلب</span>

                  <span className="wz-ot__mono" style={{ direction: "ltr", unicodeBidi: "plaintext" }}>
                    {effectiveId}
                  </span>

                  <button
                    type="button"
                    className="wz-ot__iconBtn"
                    onClick={copyRef}
                    aria-label="نسخ مرجع الطلب"
                    title="نسخ مرجع الطلب"
                  >
                    <Copy size={16} />
                  </button>

                  {copied ? <span className="wz-ot__copied">تم النسخ!</span> : null}
                </div>

                {/* Quick actions */}
                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <Link to={`/order-confirm/${effectiveId}`} state={{ order }} className="wz-ot__actionLink">
                    <button className="wz-ot__btn wz-ot__btn--track" type="button">
                      تفاصيل الطلب <ArrowLeft size={16} />
                    </button>
                  </Link>
                </div>
              </section>

              {/* COD Note */}
              <section className="wz-ot__card wz-ot__card--note wz-ot-anim wz-ot-anim--d2">
                <div className="wz-ot__cardBody wz-ot__payRow">
                  <Banknote size={20} className="wz-ot__payIcon" />
                  <div className="wz-ot__payText">
                    <span className="wz-ot__payTitle">الدفع عند الاستلام</span>
                    <span className="wz-ot__paySub">— المبلغ المستحق: {money(amountDue)} د.ت عند التسليم</span>
                  </div>
                  <ShieldCheck size={16} className="wz-ot__payShield" />
                </div>
              </section>

              {/* Timeline */}
              <section className="wz-ot__card wz-ot-anim wz-ot-anim--d2">
                <div className="wz-ot__cardBody wz-ot__cardBody--lg">
                  <h2 className="wz-ot__sectionTitle">مخطط الشحنة</h2>

                  <div className="wz-ot__timeline">
                    {steps.map((s, i) => {
                      const Icon = s.icon;
                      const last = i === steps.length - 1;
                      return (
                        <div className="wz-ot__step" key={i}>
                          <div className="wz-ot__stepLeft">
                            <div className={`wz-ot__dot ${s.done ? "is-done" : ""}`}>
                              <Icon size={18} />
                            </div>
                            {!last ? <div className={`wz-ot__line ${s.done ? "is-done" : ""}`} /> : null}
                          </div>

                          <div className="wz-ot__stepBody">
                            <div className={`wz-ot__stepTitle ${s.done ? "is-done" : ""}`}>{s.label}</div>
                            <div className="wz-ot__stepDesc">{s.desc}</div>
                            <div className="wz-ot__stepDate">{s.date}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                 
                </div>
              </section>

              {/* Products */}
              <section className="wz-ot__card wz-ot-anim wz-ot-anim--d3">
                <div className="wz-ot__cardBody wz-ot__cardBody--lg">
                  <h2 className="wz-ot__sectionTitle">المنتجات المطلوبة</h2>

                  {orderedLinesSimple.length ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      {orderedLinesSimple.map((it) => (
                        <div
                          key={it.key}
                          style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                            border: "1px solid rgba(0,0,0,.08)",
                            background: "rgba(255,255,255,.8)",
                            padding: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 64,
                              height: 64,
                              border: "1px solid rgba(0,0,0,.10)",
                              overflow: "hidden",
                              flex: "0 0 64px",
                              display: "grid",
                              placeItems: "center",
                              background: "#fff",
                            }}
                          >
                            {it.img ? (
                              <img
                                src={it.img}
                                alt={it.title}
                                loading="lazy"
                                decoding="async"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <ImageIcon size={18} />
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 900 }} title={it.title}>
                              {it.title}
                            </div>

                            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                              {it.color ? <span>اللون: {it.color} </span> : null}
                              {it.size ? <span>— المقاس: {it.size} </span> : null}
                              <span>— الكمية: {it.qty}</span>
                            </div>

                            {it.colorKey ? (
                              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4, direction: "ltr" }}>
                                colorKey: {it.colorKey}
                              </div>
                            ) : null}
                          </div>

                          <div style={{ textAlign: "left", whiteSpace: "nowrap" }}>
                            <div style={{ fontWeight: 900 }}>{money(it.total)} د.ت</div>
                            {it.unit ? (
                              <div style={{ fontSize: 12, opacity: 0.8 }}>سعر القطعة: {money(it.unit)} د.ت</div>
                            ) : null}
                          </div>
                        </div>
                      ))}

                      <div style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>
                        <div>
                          المجموع الفرعي: <strong>{money(totals.subtotal)} د.ت</strong>
                        </div>
                        <div>
                          الشحن:{" "}
                          <strong>{Number(totals.shipping) === 0 ? "مجاني" : `${money(totals.shipping)} د.ت`}</strong>
                        </div>
                        <div>
                          الإجمالي: <strong>{money(totals.total)} د.ت</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="wz-ot__empty">لا توجد تفاصيل منتجات لهذا المرجع.</div>
                  )}
                </div>
              </section>

              {/* Guest details */}
              <section className="wz-ot__card wz-ot-anim wz-ot-anim--d3">
                <div className="wz-ot__cardBody wz-ot__cardBody--lg">
                  <h2 className="wz-ot__sectionTitle">بيانات الحريف</h2>

                  <div className="wz-ot__details">
                    <div className="wz-ot__box">
                      <div className="wz-ot__muted">الاسم</div>
                      <div className="wz-ot__strong">{safeText(order?.name || "—")}</div>

                      <div className="wz-ot__spacer" />

                      <div className="wz-ot__muted">الهاتف</div>
                      <div className="wz-ot__strong">
                        <LTR>{safeText(order?.phone || "—")}</LTR>
                      </div>
                    </div>

                    <div className="wz-ot__box">
                      <div className="wz-ot__muted">البريد الإلكتروني</div>
                      <div className="wz-ot__strong">{safeText(order?.email || "—")}</div>

                      <div className="wz-ot__spacer" />

                      <div className="wz-ot__muted">طريقة الدفع</div>
                      <div className="wz-ot__strong">الدفع عند الاستلام</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, fontSize: 13, opacity: 0.95 }}>
                    <span className="wz-ot__muted">العنوان: </span>
                    <span>
                      {safeText(order?.address?.street || order?.address?.address) || safeText(order?.address) ? (
                        <>
                          {safeText(order?.address?.street || order?.address?.address)}
                          {safeText(order?.address?.city) ? `، ${safeText(order.address.city)}` : ""}
                          {safeText(order?.address?.state) ? `، ${safeText(order.address.state)}` : ""}
                          {safeText(order?.address?.zipcode || order?.address?.postalCode || order?.address?.postal)
                            ? `، ${safeText(order.address.zipcode || order.address.postalCode || order.address.postal)}`
                            : ""}
                          {safeText(order?.address?.country) ? `، ${safeText(order.address.country)}` : ""}
                        </>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                </div>
              </section>

              {/* Support */}
              <section className="wz-ot__card wz-ot__card--support wz-ot-anim wz-ot-anim--d3">
                <div className="wz-ot__cardBody wz-ot__cardBody--lg wz-ot__support">
                  <h2 className="wz-ot__supportTitle">هل تحتاج مساعدة؟</h2>
                  <p className="wz-ot__supportSub">فريق الدعم متاح لمساعدتك</p>

                  <div className="wz-ot__supportBtns">
                    <button className="wz-ot__btnGhost" type="button">
                      <Phone size={16} />
                      <LTR className="wz-ot__ltr">+216 55 495 816</LTR>
                    </button>

                    <button className="wz-ot__btnGhost" type="button">
                      <Mail size={16} />
                      <LTR className="wz-ot__ltr">wahretzmensabri521@gmail.com / emnabes930@gmail.com</LTR>
                    </button>

                    <button className="wz-ot__btnGhost" type="button">
                      <MessageCircle size={16} /> واتساب
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}