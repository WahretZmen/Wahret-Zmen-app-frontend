// src/pages/OrderConfirm.jsx
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
  ExternalLink,
} from "lucide-react";

import Header from "../components/ui/Header.jsx";
import Footer from "../components/ui/Footer.jsx";

import getBaseUrl from "../utils/baseURL";
import { getImgUrl } from "../utils/getImgUrl";
import "../Styles/StylesOrderConfirm.css";

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

const getPid = (line) => {
  if (typeof line?.productId === "string") return safeText(line.productId);
  if (typeof line?.productData?.productId === "string") return safeText(line.productData.productId);
  if (typeof line?.product?.productId === "string") return safeText(line.product.productId);
  return "";
};

const pickLangText = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    return safeText(value?.ar || value?.fr || value?.en || "");
  }
  return "";
};

const CATEGORY_AR_MAP = {
  men: "رجال",
  women: "نساء",
  children: "أطفال",
};

const SUBCATEGORY_AR_MAP = {
  accessories: "إكسسوارات",
  costume: "بدلة",
  vest: "صدريّة",
  mens_abaya: "عباية رجالية",
  jebba: "جبّة",
};

const pickCategory = (line) => {
  const raw = safeText(
    line?.category ||
      line?.productData?.category ||
      line?.productId?.category ||
      line?.product?.category ||
      ""
  ).toLowerCase();

  return CATEGORY_AR_MAP[raw] || raw || "";
};

const pickSubCategory = (line) => {
  const raw = safeText(
    line?.subCategory ||
      line?.productData?.subCategory ||
      line?.productId?.subCategory ||
      line?.product?.subCategory ||
      ""
  ).toLowerCase();

  return SUBCATEGORY_AR_MAP[raw] || raw || "";
};

const pickEmbroidery = (line) => {
  return (
    pickLangText(line?.embroideryCategory) ||
    pickLangText(line?.productData?.embroideryCategory) ||
    pickLangText(line?.product?.embroideryCategory) ||
    ""
  );
};

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
  {
    icon: CheckCircle,
    label: "تم تأكيد الطلب",
    date: "—",
    desc: "تم استلام طلبك وتأكيده بنجاح",
    done: false,
  },
  {
    icon: Package,
    label: "قيد التحضير",
    date: "—",
    desc: "حرفيّونا يقومون بتجهيز الطلب بعناية",
    done: false,
  },
  {
    icon: Truck,
    label: "خارج للتسليم",
    date: "—",
    desc: "طلبك في الطريق إليك",
    done: false,
  },
  {
    icon: Banknote,
    label: "تم التسليم والدفع",
    date: "—",
    desc: "الدفع نقدًا عند الاستلام",
    done: false,
  },
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
    sessionStorage.setItem(
      "wz_last_order",
      JSON.stringify({ orderId: v, order, savedAt: Date.now() })
    );
  } catch (_) {}
  try {
    sessionStorage.setItem(`wz_order_${v}`, JSON.stringify(order));
  } catch (_) {}
};

export default function OrderConfirm() {
  const { orderId } = useParams();
  const location = useLocation();

  const [trackingId, setTrackingId] = useState(orderId || "");
  const [hasSearched, setHasSearched] = useState(Boolean(orderId));
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const [copied, setCopied] = useState(false);

  const [silentRefreshing, setSilentRefreshing] = useState(false);
  const pollRef = useRef(null);

  const effectiveId = safeText(trackingId) || orderId || makeFallbackId();

  useEffect(() => {
    document.documentElement.dir = "rtl";
  }, []);

  const LTR = ({ children, className = "" }) => (
    <span
      dir="ltr"
      className={className}
      style={{ unicodeBidi: "plaintext", direction: "ltr" }}
    >
      {children}
    </span>
  );

  const fetchOrderByTrackId = async (trackId) => {
    const v = safeText(trackId);
    if (!v) return null;

    const rawBase = String(getBaseUrl() || "").trim().replace(/\/$/, "");
    const emailQuery = safeText(location.state?.order?.email || readAnyStoredOrder(v)?.email || "");
    const url = emailQuery
      ? `${rawBase}/api/orders/track/${encodeURIComponent(v)}?email=${encodeURIComponent(emailQuery)}`
      : `${rawBase}/api/orders/track/${encodeURIComponent(v)}`;

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

    if (!silent) {
      const passed = location.state?.order || null;
      const passedId = safeText(passed?.orderId || passed?._id);
      if (passed && passedId === v) setOrder(passed);
    }

    if (!silent) {
      const stored = readAnyStoredOrder(v);
      const storedId = safeText(stored?.orderId || stored?._id);
      if (stored && storedId === v) setOrder(stored);
    }

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

  useEffect(() => {
    if (!orderId) return;
    runSearch(orderId, { silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    const id = safeText(effectiveId);
    if (!hasSearched || !id) return;

    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(() => {
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

  const products = useMemo(
    () => (Array.isArray(order?.products) ? order.products : []),
    [order]
  );

  const totals = useMemo(() => {
    const subtotal = order?.totals?.subtotal ?? order?.subtotal ?? 0;
    const shipping = order?.totals?.shipping ?? order?.shipping ?? 0;
    const total = order?.totals?.total ?? order?.totalPrice ?? order?.total ?? 0;
    return { subtotal, shipping, total };
  }, [order]);

  const totalOrderedUnits = useMemo(() => {
    return products.reduce((sum, line) => sum + Math.max(1, Number(line?.quantity || 1)), 0);
  }, [products]);

  const amountDue = useMemo(() => Number(totals?.total || 0) || 0, [totals]);

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

  const orderStatus = useMemo(() => {
    const s = safeText(order?.status);
    return STATUSES.includes(s) ? s : "تم تأكيد الطلب";
  }, [order]);

  const orderPct = useMemo(() => percentOfStatus(orderStatus), [orderStatus]);

  const progressMap = useMemo(() => getProgressObj(order), [order]);

  const orderedPieces = useMemo(() => {
    const pieces = [];
    products.forEach((line, lineIndex) => {
      const qty = Math.max(1, Number(line?.quantity || 1));
      for (let itemIndex = 0; itemIndex < qty; itemIndex++) {
        const key = buildProgressKey(line, lineIndex, itemIndex);
        const rawProgress = progressMap?.[key];

        let status = orderStatus;
        if (typeof rawProgress === "number") {
          if (rawProgress >= 100) status = "تم التسليم والدفع";
          else if (rawProgress >= 60) status = "خارج للتسليم";
          else if (rawProgress >= 40) status = "قيد التحضير";
          else status = "تم تأكيد الطلب";
        } else {
          const textProgress = safeText(rawProgress);
          status = STATUSES.includes(textProgress) ? textProgress : orderStatus;
        }

        const idx = statusIndex(status);
        const pct = percentOfStatus(status);
        pieces.push({ key, status, statusIdx: idx, pct, lineIndex, itemIndex });
      }
    });
    return pieces;
  }, [products, progressMap, orderStatus]);

  const globalPctPieces = useMemo(() => {
    if (!orderedPieces.length) return 0;
    const sum = orderedPieces.reduce((acc, it) => acc + (it.pct || 0), 0);
    return Math.round(sum / orderedPieces.length);
  }, [orderedPieces]);

  const hasAnyPieceProgress = useMemo(
    () => Object.keys(progressMap || {}).length > 0,
    [progressMap]
  );

  const globalPct = hasAnyPieceProgress ? globalPctPieces : orderPct;

  const steps = useMemo(() => {
    const st = trackingStepsSeed.map((x) => ({ ...x }));
    const doneCount = Math.floor((globalPct / 100) * STATUSES.length);
    for (let i = 0; i < st.length; i++) st[i].done = i < doneCount;
    return st;
  }, [globalPct]);

  const completedSteps = useMemo(() => steps.filter((s) => s.done).length, [steps]);

  const progress = useMemo(
    () => (steps.length ? (completedSteps / steps.length) * 100 : 0),
    [completedSteps, steps.length, steps]
  );

  const orderedLinesSimple = useMemo(() => {
    return products.map((line, idx) => {
      const title = pickTitle(line);
      const img = pickLineImage(line);
      const color = pickColorName(line);
      const size = pickSize(line);
      const pid = getPid(line);
      const category = pickCategory(line);
      const subCategory = pickSubCategory(line);
      const embroidery = pickEmbroidery(line);
      const qty = Math.max(1, Number(line?.quantity || 1));

      return {
        key: line?._id || `${getPid(line) || "line"}-${idx}`,
        title,
        img,
        color,
        size,
        qty,
        pid,
        category,
        subCategory,
        embroidery,
        
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

                    <span className="wz-ot__chip" title="إجمالي القطع المطلوبة">
                      القطع: {totalOrderedUnits}
                    </span>

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

                <div className="wz-ot__trackRef" style={{ marginTop: 10 }}>
                  <span className="wz-ot__muted">مرجع الطلب</span>

                  <span
                    className="wz-ot__mono"
                    style={{ direction: "ltr", unicodeBidi: "plaintext" }}
                  >
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

                <div style={{ marginTop: 10, fontSize: 14, fontWeight: 800 }}>
                  إجمالي الكمية المطلوبة في هذا الطلب: <strong>{totalOrderedUnits}</strong>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <Link
                    to={`/order-confirm/${effectiveId}`}
                    state={{ order }}
                    className="wz-ot__actionLink"
                  >
                    <button className="wz-ot__btn wz-ot__btn--track" type="button">
                      تفاصيل الطلب <ArrowLeft size={16} />
                    </button>
                  </Link>
                </div>
              </section>

              <section className="wz-ot__card wz-ot__card--note wz-ot-anim wz-ot-anim--d2">
                <div className="wz-ot__cardBody wz-ot__payRow">
                  <Banknote size={20} className="wz-ot__payIcon" />
                  <div className="wz-ot__payText">
                    <span className="wz-ot__payTitle">الدفع عند الاستلام</span>
                  </div>
                  <ShieldCheck size={16} className="wz-ot__payShield" />
                </div>
              </section>

              <section className="wz-ot__card wz-ot-anim wz-ot-anim--d2">
                <div className="wz-ot__cardBody wz-ot__cardBody--lg">
                  <h2 className="wz-ot__sectionTitle">مخطط التوصيل</h2>

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
                            {!last ? (
                              <div className={`wz-ot__line ${s.done ? "is-done" : ""}`} />
                            ) : null}
                          </div>

                          <div className="wz-ot__stepBody">
                            <div className={`wz-ot__stepTitle ${s.done ? "is-done" : ""}`}>
                              {s.label}
                            </div>
                            <div className="wz-ot__stepDesc">{s.desc}</div>
                            <div className="wz-ot__stepDate">{s.date}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="wz-ot__card wz-ot-anim wz-ot-anim--d3">
                <div className="wz-ot__cardBody wz-ot__cardBody--lg">
                  <h2 className="wz-ot__sectionTitle">المنتجات المطلوبة</h2>

                  {orderedLinesSimple.length ? (
                    <div className="wz-ot__itemsBig">
                      {orderedLinesSimple.map((it) => (
                        <div key={it.key} className="wz-ot__itemBig">
                          <div className="wz-ot__itemBigMedia">
                            {it.img ? (
                              <a
                                href={it.img}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="wz-ot__imgLink"
                                title="فتح الصورة في تبويب جديد"
                                aria-label={`فتح صورة ${it.title} في تبويب جديد`}
                              >
                                <div className="wz-ot__imgFrameLarge">
                                  <img
                                    src={it.img}
                                    alt={it.title}
                                    loading="lazy"
                                    decoding="async"
                                    className="wz-ot__imgLarge"
                                  />
                                </div>

                                <span className="wz-ot__openImgBadge">
                                  <ExternalLink size={15} />
                                  فتح الصورة
                                </span>
                              </a>
                            ) : (
                              <div className="wz-ot__imgFrameLarge">
                                <div className="wz-ot__imgFallbackLarge">
                                  <ImageIcon size={22} />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="wz-ot__itemBigMain">
                            <div className="wz-ot__itemBigTitle" title={it.title}>
                              {it.title}
                            </div>

                            <div className="wz-ot__itemBigMeta">
                              {it.pid ? <span>Product ID (منتج): {it.pid}</span> : null}
                              {it.category ? <span>الفئة: {it.category}</span> : null}
                              {it.subCategory ? <span>التصنيف الفرعي: {it.subCategory}</span> : null}
                              {it.embroidery ? <span>نوع التطريز: {it.embroidery}</span> : null}
                              {it.color ? <span>اللون: {it.color}</span> : null}
                              {it.size ? <span>المقاس: {it.size}</span> : null}
                              <span>الكمية: {it.qty}</span>
                            </div>

                            {it.colorKey ? (
                              <div className="wz-ot__itemBigKey">
                                colorKey: {it.colorKey}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}

                      <div style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>
                        <div>
                          التوصيل:{" "}
                          <strong>
                            {Number(totals.shipping) === 0
                              ? "مجاني"
                              : `${money(totals.shipping)} د.ت`}
                          </strong>
                        </div>
                        <div style={{ marginTop: 6 }}>
                          إجمالي كل القطع المطلوبة: <strong>{totalOrderedUnits}</strong>
                        </div>
                        <div style={{ marginTop: 6 }}>
                          المبلغ الإجمالي: <strong>{money(amountDue)} د.ت</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="wz-ot__empty">لا توجد تفاصيل منتجات لهذا المرجع.</div>
                  )}
                </div>
              </section>

              <section className="wz-ot__card wz-ot-anim wz-ot-anim--d3">
                <div className="wz-ot__cardBody wz-ot__cardBody--lg">
                  <h2 className="wz-ot__sectionTitle">بيانات الحريف</h2>

                  <div className="wz-ot__details">
                    <div className="wz-ot__box">
                      <div className="wz-ot__muted">الاسم</div>
                      <div className="wz-ot__strong">{guest.fullName}</div>

                      <div className="wz-ot__spacer" />

                      <div className="wz-ot__muted">الهاتف</div>
                      <div className="wz-ot__strong">
                        <LTR>{guest.phone}</LTR>
                      </div>
                    </div>

                    <div className="wz-ot__box">
                      <div className="wz-ot__muted">البريد الإلكتروني</div>
                      <div className="wz-ot__strong">{guest.email}</div>

                      <div className="wz-ot__spacer" />

                      <div className="wz-ot__muted">طريقة الدفع</div>
                      <div className="wz-ot__strong">الدفع عند الاستلام</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, fontSize: 13, opacity: 0.95 }}>
                    <span className="wz-ot__muted">العنوان: </span>
                    <span>{guest.addressLine}</span>
                  </div>
                </div>
              </section>

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
                      <LTR className="wz-ot__ltr">
                        wahretzmensabri521@gmail.com / emnabes930@gmail.com
                      </LTR>
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