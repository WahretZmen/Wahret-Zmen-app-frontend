// src/pages/products/SingleProduct.jsx
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiLink,
  FiPhoneCall,
  FiArrowUpRight,
} from "react-icons/fi";
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

const displayId = (p) =>
  safeStr(p?.productId || p?._id || p?.id || p?.slug || "").trim();

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

const getEmbroideryKey = (p) => normalizeKey(pickEmbroideryText(p));

const resolveProductFromList = (list, routeId) => {
  if (!Array.isArray(list) || !routeId) return null;
  const wanted = String(routeId).trim();

  return (
    list.find((p) => String(p?._id || "") === wanted) ||
    list.find((p) => String(p?.id || "") === wanted) ||
    list.find((p) => String(p?.productId || "") === wanted) ||
    list.find((p) => String(p?.slug || "") === wanted) ||
    null
  );
};

function normalizeColor(color) {
  if (!color) return null;

  const images =
    Array.isArray(color.images) && color.images.length
      ? color.images
      : color.image
      ? [color.image]
      : [];

  const first = images[0] || "";
  const colorName =
    typeof color.colorName === "string"
      ? { en: color.colorName, fr: color.colorName, ar: color.colorName }
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

const getProductGallery = (product, selectedColor) => {
  if (!product) return [];

  const norm = selectedColor ? normalizeColor(selectedColor) : null;
  if (norm?.images?.length) return unique(norm.images);

  const colorImages = unique(
    (product?.colors || []).flatMap((c) => {
      const n = normalizeColor(c);
      return n?.images || [];
    })
  );
  if (colorImages.length) return colorImages;

  if (Array.isArray(product?.images) && product.images.length) {
    return unique(product.images);
  }

  return product?.coverImage ? [product.coverImage] : [];
};

/* =============================================================================
   Category maps
============================================================================= */
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
  if (["children", "kids", "kid", "enfant", "enfants", "أطفال"].includes(k)) {
    return "children";
  }
  return k || "products";
};

const EN_CATEGORY_MAP = {
  women: "Women",
  men: "Men",
  children: "Children",
};

/* =============================================================================
   Sub-category maps
============================================================================= */
const SUBCATEGORY_AR_MAP = {
  "": "",
  accessories: "إكسسوارات",
  accessoire: "إكسسوارات",
  accessoires: "إكسسوارات",
  accessory: "إكسسوارات",
  إكسسوارات: "إكسسوارات",
  اكسسوارات: "إكسسوارات",

  costume: "بدلة",
  suit: "بدلة",
  بدلة: "بدلة",

  vest: "صدريّة",
  gilet: "صدريّة",
  "صدريّة": "صدريّة",
  صدرية: "صدريّة",

  mens_abaya: "عباية رجالي",
  "mens abaya": "عباية رجالي",
  "men abaya": "عباية رجالي",
  "abaya homme": "عباية رجالي",
  "عباية رجالي": "عباية رجالي",
  "عباية رجالية": "عباية رجالي",

  jebba: "جبة",
  jebbah: "جبة",
  جبة: "جبة",
  "جبّة": "جبة",
};

const normalizeSubCategoryKey = (raw) => {
  const k = normalizeKey(raw);

  if (!k || ["all", "tous", "الكل"].includes(k)) return "";
  if (
    ["accessories", "accessoire", "accessoires", "accessory", "إكسسوارات", "اكسسوارات"].includes(
      k
    )
  ) {
    return "accessories";
  }
  if (["costume", "suit", "بدلة"].includes(k)) return "costume";
  if (["vest", "gilet", "صدريّة", "صدرية"].includes(k)) return "vest";
  if (
    ["mens_abaya", "mens abaya", "men abaya", "abaya homme", "عباية رجالي", "عباية رجالية"].includes(
      k
    )
  ) {
    return "mens_abaya";
  }
  if (["jebba", "jebbah", "جبة", "جبّة"].includes(k)) return "jebba";

  return k;
};

const mapSubCategoryToArabic = (raw) => {
  const key = normalizeSubCategoryKey(raw);
  return SUBCATEGORY_AR_MAP[key] || pickText(raw) || "";
};

const pickSubCategoryText = (p) => {
  const raw =
    p?.subCategory ??
    p?.subcategory ??
    p?.sub_category ??
    p?.subCat ??
    p?.sub_cat ??
    p?.subcategorie ??
    p?.sub_categorie ??
    p?.subCategoryName;

  return mapSubCategoryToArabic(raw);
};

const getSubCategoryKey = (p) => {
  const raw =
    p?.subCategory ??
    p?.subcategory ??
    p?.sub_category ??
    p?.subCat ??
    p?.sub_cat ??
    p?.subcategorie ??
    p?.sub_categorie ??
    p?.subCategoryName;

  return normalizeSubCategoryKey(raw);
};

/* =============================================================================
   Static boutique rating
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
   Related cards helpers
============================================================================= */
const getCardSubText = (p) => {
  const sub = pickSubCategoryText(p);
  const emb = pickEmbroideryText(p);
  if (sub && emb) return `${sub} · ${emb}`;
  return sub || emb || "";
};

const getCardRating = (p) =>
  Math.max(0, Math.min(5, Math.round(Number(p?.rating ?? 0))));

/* =============================================================================
   Component
============================================================================= */
const SingleProduct = () => {
  const params = useParams();
  const location = useLocation();
  const routeId = params?.productId || params?.id || "";
  const isRTL = true;
  const pageTopRef = useRef(null);

  useSelector((s) => {
    const c = s?.cart;
    return c?.cartItems || c?.items || c?.products || c?.cart || [];
  });

  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: queriedProduct,
    isLoading: isLoadingProduct,
    isError: isQueryError,
  } = useGetProductByIdQuery(routeId, { skip: !routeId });

  const { data: allProducts = [], isLoading: isLoadingAll } = useGetAllProductsQuery();

  const product = useMemo(() => {
    if (queriedProduct && typeof queriedProduct === "object") return queriedProduct;
    return resolveProductFromList(allProducts, routeId);
  }, [queriedProduct, allProducts, routeId]);

  const isLoading = !product && (isLoadingProduct || isLoadingAll);
  const isError = !product && !isLoading && isQueryError;

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const THUMBS_PER_VIEW = 6;
  const [thumbStart, setThumbStart] = useState(0);

  const [activeTab, setActiveTab] = useState("desc");

  const translatedTitle = pickTitle(product);
  const translatedDescription =
    product?.translations?.ar?.description ||
    product?.description ||
    product?.translations?.fr?.description ||
    product?.translations?.en?.description ||
    "لا يوجد وصف متاح لهذا المنتج.";

  const categoryAr = mapCategoryToArabic(product?.category);
  const categoryKey = normalizeCategoryKey(product?.category);
  const categoryEn = EN_CATEGORY_MAP[categoryKey] || "Products";

  const embroideryText = pickEmbroideryText(product);
  const embroideryKey = getEmbroideryKey(product);

  const subCategoryText = pickSubCategoryText(product);
  const subCategoryKey = getSubCategoryKey(product);

  const isTrending = Boolean(
    product?.trending ||
      product?.isTrending ||
      product?.tags?.includes?.("trending") ||
      product?.labels?.includes?.("trending")
  );

  const breadcrumbCurrentLabel = useMemo(() => {
    const pieces = ["منتج", categoryEn];
    if (subCategoryText) pieces.push(subCategoryText);
    if (embroideryText) pieces.push(embroideryText);
    return pieces.join(" - ");
  }, [categoryEn, subCategoryText, embroideryText]);

  const activeGallery = useMemo(() => {
    return getProductGallery(product, selectedColor);
  }, [product, selectedColor]);

  const scrollPageToTop = useCallback(() => {
    if (typeof window === "undefined") return;

    const html = document.documentElement;
    const body = document.body;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    html.scrollTop = 0;
    body.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if (pageTopRef.current) {
      pageTopRef.current.scrollIntoView({
        block: "start",
        inline: "nearest",
        behavior: "auto",
      });
    }
  }, []);

  /* ---------------------------------------------------------------------------
     Force top immediately on route/path change
  --------------------------------------------------------------------------- */
  useLayoutEffect(() => {
    scrollPageToTop();

    const raf1 = requestAnimationFrame(() => {
      scrollPageToTop();

      const raf2 = requestAnimationFrame(() => {
        scrollPageToTop();
      });

      return () => cancelAnimationFrame(raf2);
    });

    return () => cancelAnimationFrame(raf1);
  }, [routeId, location.pathname, scrollPageToTop]);

  /* ---------------------------------------------------------------------------
     Force top again once product data is ready
  --------------------------------------------------------------------------- */
  useEffect(() => {
    if (!product) return;

    scrollPageToTop();

    const t1 = setTimeout(() => scrollPageToTop(), 0);
    const t2 = setTimeout(() => scrollPageToTop(), 120);
    const t3 = setTimeout(() => scrollPageToTop(), 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [product, routeId, scrollPageToTop]);

  useEffect(() => {
    if (!product) return;

    const firstColor =
      (Array.isArray(product.colors) && product.colors.length
        ? normalizeColor(product.colors[0])
        : null) ||
      (product.coverImage
        ? {
            colorName: { en: "Default", ar: "افتراضي", fr: "Default" },
            name: { en: "Default", ar: "افتراضي", fr: "Default" },
            images: [product.coverImage],
            image: product.coverImage,
            stock: num(product.stockQuantity || product.stock),
          }
        : null);

    setSelectedColor(firstColor);
    setSelectedImageIndex(0);
    setThumbStart(0);
    setActiveTab("desc");
  }, [routeId, product]);

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
  }, [selectedImageIndex, activeGallery.length, thumbStart]);

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
      const subCat = safeStr(
        typeof p?.subCategory === "object"
          ? p?.subCategory?.ar || p?.subCategory?.fr || p?.subCategory?.en || ""
          : p?.subCategory || ""
      ).toLowerCase();
      const pid = displayId(p).toLowerCase();

      const matchesTitle =
        titleMain.includes(q) || tAr.includes(q) || tFr.includes(q) || tEn.includes(q);
      const matchesCat = cat.includes(q);
      const matchesSubCat = subCat.includes(q);
      const matchesId = pid.includes(q);

      if (matchesTitle || matchesCat || matchesSubCat || matchesId) picks.push(p);
    }

    return picks.slice(0, 10);
  }, [allProducts, searchTerm]);

  const ratingValue = Math.max(0, Math.min(5, Math.round(Number(product?.rating ?? 0))));

  const renderStars = (rating, big = false) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`sp2-star ${big ? "sp2-starBig" : ""} ${i < rating ? "is-on" : "is-off"}`}
        aria-hidden="true"
      />
    ));

  const shareUrl = useMemo(() => {
    try {
      return window.location.href;
    } catch {
      return "";
    }
  }, [routeId, location.pathname]);

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
    el.style.setProperty("--zoom-x", "50%");
    el.style.setProperty("--zoom-y", "50%");
  }, []);

  const compositionText = pickText(product?.composition);
  const matiereText = pickText(product?.matiere);
  const coupeText = pickText(product?.coupe);
  const madeInText = pickText(product?.madeIn);
  const isHandmade = Boolean(product?.isHandmade);

  const maxThumbStart = Math.max(0, activeGallery.length - THUMBS_PER_VIEW);
  const canThumbPrev = thumbStart > 0;
  const canThumbNext = thumbStart < maxThumbStart;

  const visibleThumbs = activeGallery.slice(thumbStart, thumbStart + THUMBS_PER_VIEW);
  const onThumbPrev = () =>
    canThumbPrev && setThumbStart((s) => Math.max(0, s - THUMBS_PER_VIEW));
  const onThumbNext = () =>
    canThumbNext && setThumbStart((s) => Math.min(maxThumbStart, s + THUMBS_PER_VIEW));

  const productsCategoryUrl = `/products?category=${encodeURIComponent(categoryKey)}`;
  const productsSubCategoryUrl =
    subCategoryKey && categoryKey
      ? `/products?category=${encodeURIComponent(categoryKey)}&sub=${encodeURIComponent(
          subCategoryKey
        )}`
      : "";

  const sameCategoryProducts = useMemo(() => {
    if (!product || !Array.isArray(allProducts)) return [];

    const myId = displayId(product);
    const myCat = normalizeCategoryKey(product?.category);
    const mySub = getSubCategoryKey(product);

    let list = allProducts
      .filter((p) => displayId(p) !== myId)
      .filter((p) => normalizeCategoryKey(p?.category) === myCat);

    if (mySub) {
      const sameSub = list.filter((p) => getSubCategoryKey(p) === mySub);
      if (sameSub.length > 0) return sameSub.slice(0, 8);
    }

    return list.slice(0, 8);
  }, [product, allProducts]);

  const similarProducts = useMemo(() => {
    if (!product || !Array.isArray(allProducts)) return [];

    const myId = displayId(product);
    const myCat = normalizeCategoryKey(product?.category);
    const mySub = getSubCategoryKey(product);
    const myEmb = embroideryKey;

    let list = [];

    if (myEmb) {
      list = allProducts
        .filter((p) => displayId(p) !== myId)
        .filter((p) => normalizeCategoryKey(p?.category) === myCat)
        .filter((p) => (mySub ? getSubCategoryKey(p) === mySub : true))
        .filter((p) => getEmbroideryKey(p) === myEmb)
        .slice(0, 8);
    }

    if (list.length === 0 && mySub) {
      list = allProducts
        .filter((p) => displayId(p) !== myId)
        .filter((p) => normalizeCategoryKey(p?.category) === myCat)
        .filter((p) => getSubCategoryKey(p) === mySub)
        .filter((p) => Boolean(p?.trending || p?.isTrending || p?.tags?.includes?.("trending")))
        .slice(0, 8);
    }

    if (list.length === 0) {
      list = allProducts
        .filter((p) => displayId(p) !== myId)
        .filter((p) => normalizeCategoryKey(p?.category) === myCat)
        .filter((p) => Boolean(p?.trending || p?.isTrending || p?.tags?.includes?.("trending")))
        .slice(0, 8);
    }

    const sameIds = new Set(sameCategoryProducts.map((p) => displayId(p)));
    return list.filter((p) => !sameIds.has(displayId(p))).slice(0, 8);
  }, [product, allProducts, embroideryKey, sameCategoryProducts]);

  const handleInternalProductNavigation = () => {
    scrollPageToTop();
  };

  if (isLoading) {
    return (
      <div ref={pageTopRef} className="max-w-6xl mx-auto p-8">
        <div className="text-center text-[#111]">جارٍ التحميل...</div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div ref={pageTopRef} className="max-w-6xl mx-auto p-8 text-center text-red-600">
        المنتج غير موجود
      </div>
    );
  }

  return (
    <div ref={pageTopRef} className="sp2-wrap" dir={isRTL ? "rtl" : "ltr"} lang="ar">
      <FadeInSection delay={0.02} yOffset={22}>
        <div className="sp2-topSearch sp2-reveal sp2-reveal--hero">
          <div className="sp2-topSearchInner">
            <SearchInput setSearchTerm={setSearchTerm} />

            {searchTerm && (
              <div className="sp2-searchDrop sp2-reveal sp2-reveal--glass">
                {filteredProducts.length === 0 ? (
                  <div className="sp2-searchEmpty">لا توجد منتجات مطابقة</div>
                ) : (
                  <ul className="sp2-searchList">
                    {filteredProducts.map((p, idx) => {
                      const rating = Math.max(0, Math.min(5, Math.round(Number(p?.rating ?? 0))));
                      const title = pickTitle(p);
                      const pid = displayId(p);

                      return (
                        <li
                          key={pid || idx}
                          className="sp2-searchItem sp2-staggerItem"
                          style={{ "--sp2-stagger": idx }}
                        >
                          <Link
                            to={`/products/${encodeURIComponent(pid)}`}
                            onClick={handleInternalProductNavigation}
                            className="sp2-searchLink"
                          >
                            <img
                              src={getImgUrl(p?.coverImage)}
                              alt=""
                              className="sp2-searchImg"
                              loading="lazy"
                            />

                            <div className="sp2-searchMeta">
                              <div className="sp2-searchTitle">{title}</div>
                              <div className="sp2-searchSub">
                                <span className="sp2-searchStars">{renderStars(rating)}</span>
                                <span className="sp2-searchId" dir="ltr">
                                  #{pid}
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
      </FadeInSection>

      <div className="sp2-container">
        <FadeInSection delay={0.04} yOffset={16}>
          <div className="sp2-breadcrumb sp2-reveal sp2-reveal--soft">
            <Link to="/" className="sp2-crumbLink" onClick={handleInternalProductNavigation}>
              الرئيسية
            </Link>

            <span className="sp2-crumbSep">/</span>

            <Link
              to={productsCategoryUrl}
              className="sp2-crumbLink"
              onClick={handleInternalProductNavigation}
            >
              {categoryAr}
            </Link>

            {subCategoryText && productsSubCategoryUrl ? (
              <>
                <span className="sp2-crumbSep">/</span>
                <Link
                  to={productsSubCategoryUrl}
                  className="sp2-crumbLink"
                  onClick={handleInternalProductNavigation}
                >
                  {subCategoryText}
                </Link>
              </>
            ) : null}

            <span className="sp2-crumbSep">/</span>

            <span className="sp2-crumbText sp2-crumbCurrent">{breadcrumbCurrentLabel}</span>

            {displayId(product) ? (
              <span className="sp2-crumbId" dir="ltr" title={displayId(product)}>
                #{displayId(product)}
              </span>
            ) : null}
          </div>
        </FadeInSection>

        <div className="sp2-grid">
          <FadeInSection delay={0.05} yOffset={28}>
            <div className="sp2-left">
              <div className="sp2-imageCard sp2-reveal sp2-reveal--cinema">
                <div
                  className="sp2-mainImgWrap sp2-zoomStage"
                  onMouseMove={setZoomVars}
                  onMouseEnter={resetZoomVars}
                  onMouseLeave={resetZoomVars}
                >
                  {isTrending && <span className="sp2-badge">جديد</span>}
                  <span className="sp2-imageGlow" aria-hidden="true" />

                  <img
                    src={getImgUrl(
                      activeGallery[selectedImageIndex] || selectedColor?.image || product?.coverImage
                    )}
                    alt={translatedTitle}
                    className="sp2-mainImg sp2-zoomImg"
                    loading="eager"
                    decoding="async"
                    onLoad={scrollPageToTop}
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
          </FadeInSection>

          <FadeInSection delay={0.08} yOffset={24}>
            <div className="sp2-right sp2-reveal sp2-reveal--side">
              <div className="sp2-titleBlock">
                <span className="sp2-titleKicker">وهرة زمان</span>
                <h1 className="sp2-title">{translatedTitle}</h1>
              </div>

              <div className="sp2-idHero">
                <div className="sp2-idHeroLabel">مرجع المنتج</div>
                <div className="sp2-idHeroValue" dir="ltr">
                  #{displayId(product)}
                </div>
              </div>

              {subCategoryText && (
                <div className="sp2-subCategoryRow">
                  <span className="sp2-subCategoryLabel">نوع القطعة:</span>
                  <span className="sp2-subCategoryValue">{subCategoryText}</span>
                </div>
              )}

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

              <div className="sp2-ratingRow sp2-ratingRowBig">
                <span className="sp2-ratingLabel">التقييم:</span>
                <span className="sp2-ratingStars">{renderStars(ratingValue, true)}</span>
                <span className="sp2-ratingNum">({ratingValue})</span>
              </div>

              <div className="sp2-shareBlock" aria-label="مشاركة المنتج">
                <div className="sp2-shareTitle">شارك المنتج</div>

                <div className="sp2-shareRow">
                  <button
                    type="button"
                    className="sp2-shareBtn is-fb"
                    onClick={() => openShare(fbShare)}
                    aria-label="مشاركة على فيسبوك"
                    title="Facebook"
                  >
                    <FiFacebook />
                    <span>Facebook</span>
                  </button>

                  <button
                    type="button"
                    className="sp2-shareBtn is-tw"
                    onClick={() => openShare(twShare)}
                    aria-label="مشاركة على تويتر"
                    title="Twitter"
                  >
                    <FiTwitter />
                    <span>Twitter</span>
                  </button>

                  <button
                    type="button"
                    className="sp2-shareBtn is-wa"
                    onClick={() => openShare(waShare)}
                    aria-label="مشاركة على واتساب"
                    title="WhatsApp"
                  >
                    <span className="sp2-mini">WA</span>
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    className="sp2-shareBtn is-ig"
                    onClick={() => copyLink(true)}
                    aria-label="مشاركة على إنستغرام (نسخ الرابط)"
                    title="Instagram (Copy Link)"
                  >
                    <FiInstagram />
                    <span>Instagram</span>
                  </button>

                  <button
                    type="button"
                    className="sp2-shareBtn is-link"
                    onClick={() => copyLink(true)}
                    aria-label="نسخ رابط المنتج"
                    title="Copy Link"
                  >
                    <FiLink />
                    <span>نسخ الرابط</span>
                  </button>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>

        <FadeInSection delay={0.05} yOffset={22}>
          <section className="sp2-tabs sp2-reveal sp2-reveal--section">
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
              {activeTab === "desc" && (
                <div className="sp2-descBox sp2-tabPaneReveal" key="desc">
                  <div className="sp2-descTitle">وصف المنتج</div>
                  <div className="sp2-descText">{translatedDescription}</div>
                </div>
              )}

              {activeTab === "details" && (
                <div className="sp2-detailsPro sp2-tabPaneReveal" key="details">
                  <div className="sp2-detailsTop">
                    <div className="sp2-detailsRef">
                      <span>المرجع</span>
                      <strong dir="ltr">#{displayId(product)}</strong>
                    </div>
                  </div>

                  <div className="sp2-detailsTitle">المواصفات التقنية</div>

                  {subCategoryText ? (
                    <div className="sp2-detailRowPro">
                      <div className="sp2-detailKey">نوع القطعة</div>
                      <div className="sp2-detailVal">{subCategoryText}</div>
                    </div>
                  ) : null}

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

                  <div className="sp2-detailRowPro">
                    <div className="sp2-detailKey">صناعة يدوية</div>
                    <div className="sp2-detailVal">{isHandmade ? "نعم" : "لا"}</div>
                  </div>
                </div>
              )}

              {activeTab === "comments" && (
                <div className="sp2-tabText sp2-muted sp2-tabPaneReveal" key="comments">
                  لا توجد تعليقات حاليًا.
                </div>
              )}
            </div>
          </section>
        </FadeInSection>

        {sameCategoryProducts.length > 0 && (
          <FadeInSection delay={0.05} yOffset={26}>
            <section
              className="sp2-like sp2-like--lux sp2-reveal sp2-reveal--section"
              aria-label={subCategoryText ? "منتجات من نفس الفئة الفرعية" : "منتجات من نفس الفئة"}
            >
              <div className="sp2-likeHead">
                <div className="sp2-likeHeadText">
                  <span className="sp2-likeEyebrow">مختارات وهرة زمان</span>
                  <h2 className="sp2-likeTitle">
                    {subCategoryText ? "قد يعجبك من نفس نوع القطعة" : "قد يعجبك أيضًا"}
                    {subCategoryText ? (
                      <span className="sp2-likeHint"> · {subCategoryText}</span>
                    ) : null}
                  </h2>
                  <p className="sp2-likeIntro">
                    قطع مختارة بعناية بنفس الروح، لتمنحك تجربة تصفح أكثر أناقة وانسجامًا.
                  </p>
                </div>
              </div>

              <div className="sp2-likeGrid sp2-likeGrid--lux">
                {sameCategoryProducts.map((p, index) => {
                  const pid = displayId(p);

                  return (
                    <FadeInSection key={pid || index} delay={0.04 * index} yOffset={20}>
                      <Link
                        to={`/products/${encodeURIComponent(pid)}`}
                        className="sp2-likeCard sp2-likeCard--lux sp2-cardReveal"
                        onClick={handleInternalProductNavigation}
                      >
                        <div className="sp2-likeBrand">وهرة زمان</div>

                        <div className="sp2-likeImgWrap sp2-likeImgWrap--lux">
                          <span className="sp2-likeShine" aria-hidden="true" />
                          {Boolean(p?.trending || p?.isTrending) && (
                            <span className="sp2-likeBadge">رائج</span>
                          )}

                          <img
                            src={getImgUrl(p?.coverImage)}
                            alt={pickTitle(p)}
                            className="sp2-likeImg sp2-likeImg--lux"
                            loading="lazy"
                          />

                          <span className="sp2-likeArrow" aria-hidden="true">
                            <FiArrowUpRight />
                          </span>
                        </div>

                        <div className="sp2-likeMeta sp2-likeMeta--lux">
                          <div className="sp2-likeName">{pickTitle(p)}</div>

                          {getCardSubText(p) ? (
                            <div className="sp2-likeMiniSub">{getCardSubText(p)}</div>
                          ) : null}

                          <div className="sp2-likeBottom">
                            <div className="sp2-likeMiniId" dir="ltr">
                              #{pid}
                            </div>

                            <div className="sp2-likeRate" aria-label="التقييم">
                              <Star className="sp2-likeRateStar" />
                              <span>{getCardRating(p)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </FadeInSection>
                  );
                })}
              </div>
            </section>
          </FadeInSection>
        )}

        {similarProducts.length > 0 && (
          <FadeInSection delay={0.05} yOffset={26}>
            <section
              className="sp2-like sp2-like--lux sp2-reveal sp2-reveal--section"
              aria-label="منتجات مشابهة"
            >
              <div className="sp2-likeHead">
                <div className="sp2-likeHeadText">
                  <span className="sp2-likeEyebrow">Curated For You</span>
                  <h2 className="sp2-likeTitle">
                    منتجات مشابهة
                    {embroideryText ? (
                      <span className="sp2-likeHint"> · {embroideryText}</span>
                    ) : null}
                  </h2>
                  <p className="sp2-likeIntro">
                    تصاميم متقاربة في الطابع والتفاصيل لتسهّل عليك اختيار القطعة المثالية.
                  </p>
                </div>
              </div>

              <div className="sp2-likeGrid sp2-likeGrid--lux">
                {similarProducts.map((p, index) => {
                  const pid = displayId(p);

                  return (
                    <FadeInSection key={pid || index} delay={0.04 * index} yOffset={20}>
                      <Link
                        to={`/products/${encodeURIComponent(pid)}`}
                        className="sp2-likeCard sp2-likeCard--lux sp2-cardReveal"
                        onClick={handleInternalProductNavigation}
                      >
                        <div className="sp2-likeBrand">وهرة زمان</div>

                        <div className="sp2-likeImgWrap sp2-likeImgWrap--lux">
                          <span className="sp2-likeShine" aria-hidden="true" />
                          {Boolean(p?.trending || p?.isTrending) && (
                            <span className="sp2-likeBadge">رائج</span>
                          )}

                          <img
                            src={getImgUrl(p?.coverImage)}
                            alt={pickTitle(p)}
                            className="sp2-likeImg sp2-likeImg--lux"
                            loading="lazy"
                          />

                          <span className="sp2-likeArrow" aria-hidden="true">
                            <FiArrowUpRight />
                          </span>
                        </div>

                        <div className="sp2-likeMeta sp2-likeMeta--lux">
                          <div className="sp2-likeName">{pickTitle(p)}</div>

                          {getCardSubText(p) ? (
                            <div className="sp2-likeMiniSub">{getCardSubText(p)}</div>
                          ) : null}

                          <div className="sp2-likeBottom">
                            <div className="sp2-likeMiniId" dir="ltr">
                              #{pid}
                            </div>

                            <div className="sp2-likeRate" aria-label="التقييم">
                              <Star className="sp2-likeRateStar" />
                              <span>{getCardRating(p)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </FadeInSection>
                  );
                })}
              </div>
            </section>
          </FadeInSection>
        )}

        <FadeInSection delay={0.08} yOffset={28}>
          <section
            className="wz-premium-rating mt-12 sp2-reveal sp2-reveal--rating"
            aria-label="تقييم متجر وهرة زمان"
          >
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
                    <span className="wz-premium-row-percent">
                      {BOUTIQUE_RATING.distribution[stars]}%
                    </span>
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
                    <span className="wz-premium-quality-percent">
                      {BOUTIQUE_RATING.quality[k]}%
                    </span>
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