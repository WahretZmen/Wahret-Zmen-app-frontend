// src/pages/products/SingleProduct.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiFacebook, FiTwitter, FiInstagram, FiLink, FiPhoneCall } from "react-icons/fi";
import { Star } from "lucide-react";
import Swal from "sweetalert2";

import {
  useGetProductByIdQuery,
  useGetAllProductsQuery,
} from "../../redux/features/products/productsApi.js";

import { getImgUrl } from "../../utils/getImgUrl.js";
import SearchInput from "../../components/SearchInput.jsx";
import FadeInSection from "../../Animations/FadeInSection.jsx";

import "../../Styles/StylesSingleProduct.css";

/* =============================================================================
  Small helpers
============================================================================= */
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const safeStr = (v) => (typeof v === "string" ? v : String(v ?? ""));
const unique = (arr) => [...new Set((arr || []).filter(Boolean))];
const normalizeKey = (v) => String(v || "").trim().toLowerCase();

/* Admin productId (instead of Mongo _id) */
const displayId = (p) => safeStr(p?.productId || "");

/* string OR {ar,fr,en} */
const pickText = (v) => {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object") return String(v.ar || v.fr || v.en || "").trim();
  return "";
};

const pickTitle = (p) =>
  p?.translations?.ar?.title ||
  p?.title ||
  p?.translations?.fr?.title ||
  p?.translations?.en?.title ||
  "منتج";

const pickEmbroideryText = (p) => {
  const e = p?.embroideryCategory;
  if (!e) return "";
  if (typeof e === "string") return e.trim();
  return (e.ar || e.fr || e.en || "").trim();
};

const getEmbroideryKey = (p) => {
  const t = pickEmbroideryText(p);
  return normalizeKey(t);
};

function normalizeColor(color) {
  if (!color) return null;

  const images =
    Array.isArray(color.images) && color.images.length
      ? color.images
      : color.image
      ? [color.image]
      : [];

  const first = images[0];
  const colorName =
    typeof color.colorName === "string"
      ? { en: color.colorName }
      : color.colorName || {};

  return {
    _id: color._id,
    colorName,
    name: color.name || colorName,
    images,
    image: first,
    stock: num(color.stock),
  };
}

/* Category maps */
const AR_CATEGORY_MAP = {
  men: "رجال",
  women: "نساء",
  children: "أطفال",
  kids: "أطفال",
  kid: "أطفال",
  hommes: "رجال",
  homme: "رجال",
  femmes: "نساء",
  femme: "نساء",
  enfants: "أطفال",
  enfant: "أطفال",
  رجال: "رجال",
  نساء: "نساء",
  أطفال: "أطفال",
};

const mapCategoryToArabic = (raw) => {
  const key = normalizeKey(raw);
  return AR_CATEGORY_MAP[key] || raw || "غير معروف";
};

const normalizeCategoryKey = (raw) => {
  const k = normalizeKey(raw);
  if (["women", "femme", "femmes", "نساء"].includes(k)) return "women";
  if (["men", "homme", "hommes", "رجال"].includes(k)) return "men";
  if (["children", "kids", "kid", "enfant", "enfants", "أطفال"].includes(k)) return "children";
  return k || "products";
};

const EN_CATEGORY_MAP = { women: "Women", men: "Men", children: "Children" };

/* =============================================================================
  Static boutique rating (kept)
============================================================================= */
const BOUTIQUE_RATING = {
  overallScore: 5.0,
  totalReviews: 4,
  distribution: { 5: 100, 4: 0, 3: 0, 2: 0, 1: 0 },
  quality: { embroidery: 96, fabric: 94, fit: 92, packaging: 90 },
  locationLabel: "المدينة العتيقة - تونس",
  ownerLabel: "بإدارة صبري بسّعد",
};

/* =============================================================================
  Component
============================================================================= */
const SingleProduct = () => {
  const { id } = useParams();

  // RTL fixed for Wahret Zmen
  const isRTL = true;

  // Cart (kept for compatibility)
  const cartItemsRaw = useSelector((s) => {
    const c = s?.cart;
    return c?.cartItems || c?.items || c?.products || c?.cart || [];
  });
  useMemo(() => (Array.isArray(cartItemsRaw) ? cartItemsRaw : []), [cartItemsRaw]);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Data
  const { data: product, isLoading, isError } = useGetProductByIdQuery(id);
  const { data: allProducts = [] } = useGetAllProductsQuery();

  // Gallery
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Thumbnails paging (arrows move only thumbs)
  const THUMBS_PER_VIEW = 6;
  const [thumbStart, setThumbStart] = useState(0);

  // Tabs
  const [activeTab, setActiveTab] = useState("desc");

  /* ---------------------------------
    Derived product texts
  ---------------------------------- */
  const translatedTitle = pickTitle(product);
  const translatedDescription =
    product?.translations?.ar?.description ||
    product?.description ||
    product?.translations?.fr?.description ||
    product?.translations?.en?.description ||
    "لا يوجد وصف متاح لهذا المنتج.";

  const categoryAr = mapCategoryToArabic(product?.category);
  const categoryKey = normalizeCategoryKey(product?.category);
  const categoryEn = EN_CATEGORY_MAP[categoryKey] || "Women";

  const embroideryText = pickEmbroideryText(product);
  const embroideryKey = getEmbroideryKey(product);

  const isTrending = Boolean(
    product?.trending ||
      product?.isTrending ||
      product?.tags?.includes?.("trending") ||
      product?.labels?.includes?.("trending")
  );

  const breadcrumbCurrentLabel = useMemo(() => {
    const pieces = ["منتج", categoryEn];
    if (embroideryText) pieces.push(embroideryText);
    return pieces.join(" - ");
  }, [categoryEn, embroideryText]);

  /* ---------------------------------
    Gallery array (color images or cover)
  ---------------------------------- */
  const activeGallery = useMemo(() => {
    if (!product) return [];
    const norm = selectedColor ? normalizeColor(selectedColor) : null;
    if (norm?.images?.length) return unique(norm.images);
    return product.coverImage ? [product.coverImage] : [];
  }, [product, selectedColor]);

  /* ---------------------------------
    Init when product changes
  ---------------------------------- */
  useEffect(() => {
    if (!product) return;

    const firstColor =
      (Array.isArray(product.colors) && product.colors.length
        ? normalizeColor(product.colors[0])
        : null) ||
      (product.coverImage
        ? {
            colorName: { en: "Default", ar: "افتراضي" },
            name: { en: "Default", ar: "افتراضي" },
            images: [product.coverImage],
            image: product.coverImage,
            stock: num(product.stockQuantity),
          }
        : null);

    setSelectedColor(firstColor);
    setSelectedImageIndex(0);
    setThumbStart(0);
    setActiveTab("desc");

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [product?._id]);

  /* ---------------------------------
    Keep thumbs page synced with selection
  ---------------------------------- */
  useEffect(() => {
    const n = activeGallery.length;
    if (!n) return;

    const min = thumbStart;
    const max = thumbStart + THUMBS_PER_VIEW - 1;

    if (selectedImageIndex < min) {
      setThumbStart(Math.max(0, selectedImageIndex));
    } else if (selectedImageIndex > max) {
      const nextStart = Math.min(
        Math.max(0, n - THUMBS_PER_VIEW),
        Math.max(0, selectedImageIndex - (THUMBS_PER_VIEW - 1))
      );
      setThumbStart(nextStart);
    }
  }, [selectedImageIndex, activeGallery.length]); // eslint-disable-line

  /* ---------------------------------
    Search dropdown results
  ---------------------------------- */
  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];

    const picks = [];
    for (const p of allProducts) {
      const tAr = safeStr(p?.translations?.ar?.title).toLowerCase();
      const tFr = safeStr(p?.translations?.fr?.title).toLowerCase();
      const tEn = safeStr(p?.translations?.en?.title).toLowerCase();
      const titleMain = safeStr(p?.title).toLowerCase();
      const cat = safeStr(p?.category).toLowerCase();
      const pid = safeStr(p?.productId).toLowerCase();

      const matchesTitle = titleMain.includes(q) || tAr.includes(q) || tFr.includes(q) || tEn.includes(q);
      const matchesCat = cat.includes(q);
      const matchesId = pid.includes(q);

      if (matchesTitle || matchesCat || matchesId) picks.push(p);
    }

    return picks.slice(0, 10);
  }, [allProducts, searchTerm]);

  /* ---------------------------------
    Rating (0..5)
  ---------------------------------- */
  const ratingValue = Math.max(0, Math.min(5, Math.round(Number(product?.rating ?? 0))));

  const renderStars = (rating, big = false) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`sp2-star ${big ? "sp2-starBig" : ""} ${i < rating ? "is-on" : "is-off"}`}
        aria-hidden="true"
      />
    ));

  /* ---------------------------------
    Share (copy + open)
  ---------------------------------- */
  const shareUrl = useMemo(() => {
    try {
      return window.location.href;
    } catch {
      return "";
    }
  }, []);

  const fbShare = useMemo(
    () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl || "")}`,
    [shareUrl]
  );

  const twShare = useMemo(() => {
    const u = encodeURIComponent(shareUrl || "");
    const t = encodeURIComponent(translatedTitle || "");
    return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
  }, [shareUrl, translatedTitle]);

  const waShare = useMemo(
    () => `https://wa.me/?text=${encodeURIComponent(`${translatedTitle} — ${shareUrl}`)}`,
    [shareUrl, translatedTitle]
  );

  const copyLink = async (withToast = true) => {
    const text = shareUrl || "";
    if (!text) return false;

    try {
      await navigator.clipboard.writeText(text);
      if (withToast) {
        Swal.fire({
          icon: "success",
          title: "تم نسخ الرابط",
          text: "تم نسخ رابط المنتج. يمكنك لصقه مباشرة.",
          confirmButtonColor: "#111",
          confirmButtonText: "حسنًا",
          timer: 1200,
          showConfirmButton: false,
        });
      }
      return true;
    } catch {
      if (withToast) {
        Swal.fire({
          icon: "info",
          title: "انسخ الرابط يدويًا",
          text,
          confirmButtonColor: "#111",
          confirmButtonText: "حسنًا",
        });
      }
      return false;
    }
  };

  const openShare = async (url) => {
    await copyLink(false);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  /* ---------------------------------
    Pro zoom (cursor-follow)
  ---------------------------------- */
  const setZoomVars = useCallback((e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--zoom-x", `${Math.max(0, Math.min(100, x))}%`);
    el.style.setProperty("--zoom-y", `${Math.max(0, Math.min(100, y))}%`);
  }, []);

  const resetZoomVars = useCallback((e) => {
    const el = e.currentTarget;
    el.style.setProperty("--zoom-x", `50%`);
    el.style.setProperty("--zoom-y", `50%`);
  }, []);

  /* ---------------------------------
    Details ordered
  ---------------------------------- */
  const compositionText = pickText(product?.composition);
  const matiereText = pickText(product?.matiere);
  const coupeText = pickText(product?.coupe);
  const madeInText = pickText(product?.madeIn);

  /* ---------------------------------
    Thumbs paging
  ---------------------------------- */
  const thumbsTotal = activeGallery.length;
  const maxThumbStart = Math.max(0, thumbsTotal - THUMBS_PER_VIEW);
  const canThumbPrev = thumbStart > 0;
  const canThumbNext = thumbStart < maxThumbStart;

  const visibleThumbs = activeGallery.slice(thumbStart, thumbStart + THUMBS_PER_VIEW);
  const onThumbPrev = () => canThumbPrev && setThumbStart((s) => Math.max(0, s - THUMBS_PER_VIEW));
  const onThumbNext = () => canThumbNext && setThumbStart((s) => Math.min(maxThumbStart, s + THUMBS_PER_VIEW));

  const productsCategoryUrl = `/products?category=${encodeURIComponent(categoryKey)}`;

  /* ---------------------------------
    ✅ Same category + Similar products
  ---------------------------------- */
  const sameCategoryProducts = useMemo(() => {
    if (!product || !Array.isArray(allProducts)) return [];
    const myId = safeStr(product?._id);
    const myCat = normalizeCategoryKey(product?.category);

    const list = allProducts
      .filter((p) => safeStr(p?._id) !== myId)
      .filter((p) => normalizeCategoryKey(p?.category) === myCat)
      .slice(0, 8);

    return list;
  }, [product?._id, product?.category, allProducts]);

  const similarProducts = useMemo(() => {
    if (!product || !Array.isArray(allProducts)) return [];

    const myId = safeStr(product?._id);
    const myCat = normalizeCategoryKey(product?.category);
    const myEmb = embroideryKey;

    // Prefer same embroidery (if exists), otherwise fall back to trending in same category
    let list = [];

    if (myEmb) {
      list = allProducts
        .filter((p) => safeStr(p?._id) !== myId)
        .filter((p) => normalizeCategoryKey(p?.category) === myCat)
        .filter((p) => getEmbroideryKey(p) === myEmb)
        .slice(0, 8);
    }

    if (list.length === 0) {
      list = allProducts
        .filter((p) => safeStr(p?._id) !== myId)
        .filter((p) => normalizeCategoryKey(p?.category) === myCat)
        .filter((p) => Boolean(p?.trending || p?.isTrending || p?.tags?.includes?.("trending")))
        .slice(0, 8);
    }

    // Avoid duplicating cards that are already shown in same category section
    const sameIds = new Set(sameCategoryProducts.map((p) => safeStr(p?._id)));
    return list.filter((p) => !sameIds.has(safeStr(p?._id))).slice(0, 8);
  }, [product?._id, product?.category, allProducts, embroideryKey, sameCategoryProducts]);

  /* ---------------------------------
    Loading / error
  ---------------------------------- */
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center text-[#111]">جارٍ التحميل...</div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center text-red-600">
        المنتج غير موجود
      </div>
    );
  }

  return (
    <div className="sp2-wrap" dir={isRTL ? "rtl" : "ltr"} lang="ar">
      {/* Top search */}
      <div className="sp2-topSearch">
        <div className="sp2-topSearchInner">
          <SearchInput setSearchTerm={setSearchTerm} />

          {searchTerm && (
            <div className="sp2-searchDrop">
              {filteredProducts.length === 0 ? (
                <div className="sp2-searchEmpty">لا توجد منتجات مطابقة</div>
              ) : (
                <ul className="sp2-searchList">
                  {filteredProducts.map((p) => {
                    const rating = Math.max(0, Math.min(5, Math.round(Number(p?.rating ?? 0))));
                    const title = pickTitle(p);

                    return (
                      <li key={p._id} className="sp2-searchItem">
                        <Link
                          to={`/products/${p._id}`}
                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                          className="sp2-searchLink"
                        >
                          <img
                            src={getImgUrl(p.coverImage)}
                            alt=""
                            className="sp2-searchImg"
                            loading="lazy"
                          />

                          <div className="sp2-searchMeta">
                            <div className="sp2-searchTitle">{title}</div>
                            <div className="sp2-searchSub">
                              <span className="sp2-searchStars">{renderStars(rating)}</span>
                              <span className="sp2-searchId" dir="ltr">
                                #{displayId(p)}
                              </span>
                            </div>
                          </div>

                          <span className="sp2-searchGo">عرض</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="sp2-container">
        {/* Breadcrumb + Product ID */}
        <div className="sp2-breadcrumb">
          <Link to="/" className="sp2-crumbLink">
            الرئيسية
          </Link>
          <span className="sp2-crumbSep">/</span>

          <Link to={productsCategoryUrl} className="sp2-crumbLink">
            {categoryAr}
          </Link>

          <span className="sp2-crumbSep">/</span>

          <span className="sp2-crumbText sp2-crumbCurrent">
            {breadcrumbCurrentLabel}
          </span>

          {displayId(product) ? (
            <span className="sp2-crumbId" dir="ltr" title={displayId(product)}>
              #{displayId(product)}
            </span>
          ) : null}
        </div>

        <div className="sp2-grid">
          {/* Left: gallery */}
          <div className="sp2-left">
            <div className="sp2-imageCard">
              <div
                className="sp2-mainImgWrap sp2-zoomStage"
                onMouseMove={setZoomVars}
                onMouseEnter={resetZoomVars}
                onMouseLeave={resetZoomVars}
              >
                {isTrending && <span className="sp2-badge">جديد</span>}

                <img
                  src={getImgUrl(activeGallery[selectedImageIndex] || selectedColor?.image)}
                  alt={translatedTitle}
                  className="sp2-mainImg sp2-zoomImg"
                  loading="eager"
                  decoding="async"
                />
              </div>

              {activeGallery.length > 1 && (
                <div className="sp2-thumbsRow" aria-label="صور المنتج">
                  <button
                    type="button"
                    className={`sp2-thumbsNav ${canThumbPrev ? "" : "is-disabled"}`}
                    onClick={onThumbPrev}
                    disabled={!canThumbPrev}
                    aria-label="السابق"
                  >
                    ‹
                  </button>

                  <div className="sp2-thumbsTrack">
                    {visibleThumbs.map((img, localIdx) => {
                      const realIdx = thumbStart + localIdx;
                      const isActive = realIdx === selectedImageIndex;

                      return (
                        <button
                          key={img + realIdx}
                          type="button"
                          onClick={() => setSelectedImageIndex(realIdx)}
                          className={`sp2-thumbBtn ${isActive ? "is-active" : ""}`}
                          aria-label={`صورة ${realIdx + 1}`}
                        >
                          <img src={getImgUrl(img)} alt="" className="sp2-thumbImg" />
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className={`sp2-thumbsNav ${canThumbNext ? "" : "is-disabled"}`}
                    onClick={onThumbNext}
                    disabled={!canThumbNext}
                    aria-label="التالي"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: content */}
          <div className="sp2-right">
            <h1 className="sp2-title">{translatedTitle}</h1>

            <div className="sp2-idHero">
              <div className="sp2-idHeroLabel">مرجع المنتج</div>
              <div className="sp2-idHeroValue" dir="ltr">
                #{displayId(product)}
              </div>
            </div>

            <div className="sp2-priceHeader">
              <div className="sp2-priceLabel">السعر</div>

              <a
                className="sp2-vendorBtn"
                href="/contact"
                aria-label="اتصل بالبائع +216 55 495 816"
                title="اتصل بالبائع"
              >
                <FiPhoneCall />
                <span>اتصل بالبائع</span>
                <strong dir="ltr">+216 55 495 816</strong>
              </a>
            </div>

            <div className="sp2-priceHint">لمعرفة السعر، الرجاء الاتصال بالبائع.</div>

            {/* Rating BIG */}
            <div className="sp2-ratingRow sp2-ratingRowBig">
              <span className="sp2-ratingLabel">التقييم:</span>
              <span className="sp2-ratingStars">{renderStars(ratingValue, true)}</span>
              <span className="sp2-ratingNum">({ratingValue})</span>
            </div>

            {/* Share */}
            <div className="sp2-shareBlock" aria-label="مشاركة المنتج">
              <div className="sp2-shareTitle">شارك المنتج</div>

              <div className="sp2-shareRow">
                <button type="button" className="sp2-shareBtn is-fb" onClick={() => openShare(fbShare)} aria-label="مشاركة على فيسبوك" title="Facebook">
                  <FiFacebook />
                  <span>Facebook</span>
                </button>

                <button type="button" className="sp2-shareBtn is-tw" onClick={() => openShare(twShare)} aria-label="مشاركة على تويتر" title="Twitter">
                  <FiTwitter />
                  <span>Twitter</span>
                </button>

                <button type="button" className="sp2-shareBtn is-wa" onClick={() => openShare(waShare)} aria-label="مشاركة على واتساب" title="WhatsApp">
                  <span className="sp2-mini">WA</span>
                  <span>WhatsApp</span>
                </button>

                <button type="button" className="sp2-shareBtn is-ig" onClick={() => copyLink(true)} aria-label="مشاركة على إنستغرام (نسخ الرابط)" title="Instagram (Copy Link)">
                  <FiInstagram />
                  <span>Instagram</span>
                </button>

                <button type="button" className="sp2-shareBtn is-link" onClick={() => copyLink(true)} aria-label="نسخ رابط المنتج" title="Copy Link">
                  <FiLink />
                  <span>نسخ الرابط</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <section className="sp2-tabs">
          <div className="sp2-tabHead">
            <button
              type="button"
              className={`sp2-tabBtn ${activeTab === "desc" ? "is-active" : ""}`}
              onClick={() => setActiveTab("desc")}
            >
              الوصف
            </button>

            <button
              type="button"
              className={`sp2-tabBtn ${activeTab === "details" ? "is-active" : ""}`}
              onClick={() => setActiveTab("details")}
            >
              تفاصيل المنتج
            </button>

            <button
              type="button"
              className={`sp2-tabBtn ${activeTab === "comments" ? "is-active" : ""}`}
              onClick={() => setActiveTab("comments")}
            >
              التعليقات
            </button>
          </div>

          <div className="sp2-tabBody">
            {/* Description: title on top */}
            {activeTab === "desc" && (
              <div className="sp2-descBox">
                <div className="sp2-descTitle">وصف المنتج</div>
                <div className="sp2-descText">{translatedDescription}</div>
              </div>
            )}

            {/* Details: ordered */}
            {activeTab === "details" && (
              <div className="sp2-detailsPro">
                <div className="sp2-detailsTop">
                  <div className="sp2-detailsRef">
                    <span>المرجع</span>
                    <strong dir="ltr">#{displayId(product)}</strong>
                  </div>
                </div>

                <div className="sp2-detailsTitle">المواصفات التقنية</div>

                {compositionText ? (
                  <div className="sp2-detailRowPro">
                    <div className="sp2-detailKey">التركيبة</div>
                    <div className="sp2-detailVal">{compositionText}</div>
                  </div>
                ) : null}

                {matiereText ? (
                  <div className="sp2-detailRowPro">
                    <div className="sp2-detailKey">الخامة</div>
                    <div className="sp2-detailVal">{matiereText}</div>
                  </div>
                ) : null}

                {coupeText ? (
                  <div className="sp2-detailRowPro">
                    <div className="sp2-detailKey">القَصّة</div>
                    <div className="sp2-detailVal">{coupeText}</div>
                  </div>
                ) : null}

                {madeInText ? (
                  <div className="sp2-detailRowPro">
                    <div className="sp2-detailKey">بلد الصنع</div>
                    <div className="sp2-detailVal">{madeInText}</div>
                  </div>
                ) : null}
              </div>
            )}

            {activeTab === "comments" && (
              <div className="sp2-tabText sp2-muted">لا توجد تعليقات حاليًا.</div>
            )}
          </div>
        </section>

        {/* ✅ Products of same category */}
        {sameCategoryProducts.length > 0 && (
          <section className="sp2-like" aria-label="منتجات من نفس الفئة">
            <h2 className="sp2-likeTitle">قد يعجبك أيضًا</h2>

            <div className="sp2-likeGrid">
              {sameCategoryProducts.map((p) => (
                <Link
                  key={p._id}
                  to={`/products/${p._id}`}
                  className="sp2-likeCard"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  <div className="sp2-likeImgWrap">
                    <img
                      src={getImgUrl(p.coverImage)}
                      alt={pickTitle(p)}
                      className="sp2-likeImg"
                      loading="lazy"
                    />
                  </div>

                  <div className="sp2-likeMeta">
                    <div className="sp2-likeName">{pickTitle(p)}</div>
                    <div className="sp2-likeMiniId" dir="ltr">
                      #{displayId(p)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ✅ Similar products (same embroidery if exists, else trending in same category) */}
        {similarProducts.length > 0 && (
          <section className="sp2-like" aria-label="منتجات مشابهة">
            <h2 className="sp2-likeTitle">
              منتجات مشابهة {embroideryText ? <span className="sp2-likeHint">· {embroideryText}</span> : null}
            </h2>

            <div className="sp2-likeGrid">
              {similarProducts.map((p) => (
                <Link
                  key={p._id}
                  to={`/products/${p._id}`}
                  className="sp2-likeCard"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  <div className="sp2-likeImgWrap">
                    <img
                      src={getImgUrl(p.coverImage)}
                      alt={pickTitle(p)}
                      className="sp2-likeImg"
                      loading="lazy"
                    />
                  </div>

                  <div className="sp2-likeMeta">
                    <div className="sp2-likeName">{pickTitle(p)}</div>
                    <div className="sp2-likeMiniId" dir="ltr">
                      #{displayId(p)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Premium rating (kept) */}
        <FadeInSection delay={0.1}>
          <section className="wz-premium-rating mt-12" aria-label="تقييم متجر وهرة زمان">
            <h2 className="wz-premium-title">
              ثقة العملاء في متجر <span>وهرة زمان</span>
            </h2>
            <p className="text-center text-sm text-gray-600 mb-4">
              {BOUTIQUE_RATING.locationLabel} · {BOUTIQUE_RATING.ownerLabel}
            </p>

            <div className="wz-premium-grid">
              <div className="wz-premium-overall">
                <div className="wz-premium-score">{BOUTIQUE_RATING.overallScore.toFixed(1)}</div>
                <div className="wz-premium-star">★</div>
                <p className="wz-premium-label">متوسط التقييم على خرائط Google</p>
                <p className="wz-premium-sub">
                  بناءً على <strong>{BOUTIQUE_RATING.totalReviews}</strong> آراء حقيقية
                </p>
              </div>

              <div className="wz-premium-distribution">
                <h3 className="wz-premium-subtitle">توزيع التقييمات</h3>

                {[5, 4, 3, 2, 1].map((stars) => (
                  <div className="wz-premium-row" key={stars}>
                    <span className="wz-premium-row-label">{stars} نجوم</span>
                    <div className="wz-premium-row-bar">
                      <span
                        className="wz-premium-row-fill"
                        style={{ "--wz-bar": `${BOUTIQUE_RATING.distribution[stars]}%` }}
                      />
                    </div>
                    <span className="wz-premium-row-percent">{BOUTIQUE_RATING.distribution[stars]}%</span>
                  </div>
                ))}
              </div>

              <div className="wz-premium-quality">
                <h3 className="wz-premium-subtitle">آراء العملاء في الجودة</h3>

                {[
                  ["embroidery", "جودة التطريز", "دقة في التفاصيل ولمسات تقليدية فاخرة"],
                  ["fabric", "جودة القماش", "خامات مريحة ومختارة بعناية"],
                  ["fit", "تطابق المقاس", "المقاسات مطابقة لما هو مذكور"],
                  ["packaging", "تغليف الهدايا", "تغليف أنيق يناسب الهدايا الخاصة"],
                ].map(([k, title, sub]) => (
                  <div className="wz-premium-quality-row" key={k}>
                    <div className="wz-premium-quality-label">
                      {title}
                      <span>{sub}</span>
                    </div>
                    <div className="wz-premium-quality-track">
                      <span
                        className="wz-premium-quality-fill"
                        style={{ "--wz-bar": `${BOUTIQUE_RATING.quality[k]}%` }}
                      />
                    </div>
                    <span className="wz-premium-quality-percent">{BOUTIQUE_RATING.quality[k]}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </FadeInSection>
      </div>
    </div>
  );
};

export default SingleProduct;