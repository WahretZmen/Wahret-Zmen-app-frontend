// src/pages/products/ProductCard.jsx

import React, { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";

import { getImgUrl } from "../../utils/getImgUrl";
import "../../Styles/StylesProductCard.css";

/* =============================================================================
   Arabic fallback maps
============================================================================= */
const AR_FALLBACK_MAP = {
  noir: "أسود",
  black: "أسود",
  blanc: "أبيض",
  white: "أبيض",
  rouge: "أحمر",
  red: "أحمر",
  bordeaux: "خمري",
  vert: "أخضر",
  green: "أخضر",
  bleu: "أزرق",
  blue: "أزرق",
  navy: "أزرق داكن",
  turquoise: "فيروزي",
  jaune: "أصفر",
  yellow: "أصفر",
  orange: "برتقالي",
  violet: "بنفسجي",
  purple: "بنفسجي",
  rose: "وردي",
  pink: "وردي",
  marron: "بني",
  brown: "بني",
  beige: "بيج",
  gris: "رمادي",
  gray: "رمادي",
  argent: "فضي",
  silver: "فضي",
  doré: "ذهبي",
  dore: "ذهبي",
  gold: "ذهبي",
  multicolore: "متعدد الألوان",
  multicolor: "متعدد الألوان",
};

const AR_TRANSLIT_MAP = {
  فير: "أخضر",
  فرت: "أخضر",
  فيرت: "أخضر",
  خضر: "أخضر",
  بلو: "أزرق",
  بلوو: "أزرق",
  ازرق: "أزرق",
  أزرق: "أزرق",
  نوار: "أسود",
  بلان: "أبيض",
  بلانش: "أبيض",
  غري: "رمادي",
  قري: "رمادي",
};

const AR_EMBROIDERY_CATEGORY_MAP = {
  broderie: "تطريز",
  "broderie traditionnelle": "تطريز تقليدي",
  "broderie moderne": "تطريز عصري",
  "broderie main": "تطريز يدوي",
  "broderie à la main": "تطريز يدوي",
  "point de croix": "غرز متقاطعة",
  "broderie machine": "تطريز آلي",

  embroidery: "تطريز",
  "handmade embroidery": "تطريز يدوي",
  "machine embroidery": "تطريز آلي",
  "traditional embroidery": "تطريز تقليدي",
  "modern embroidery": "تطريز عصري",
};

const AR_SUBCATEGORY_MAP = {
  all: "الكل",
  tous: "الكل",
  "الكل": "الكل",

  accessories: "إكسسوارات",
  accessory: "إكسسوارات",
  accessoires: "إكسسوارات",
  accessoire: "إكسسوارات",
  "إكسسوارات": "إكسسوارات",

  costume: "بدلة",
  suit: "بدلة",
  "بدلة": "بدلة",

  vest: "صدريّة",
  gilet: "صدريّة",
  "صدريّة": "صدريّة",
  "صدرية": "صدريّة",

  mens_abaya: "عباية رجالي",
  "mens abaya": "عباية رجالي",
  "men abaya": "عباية رجالي",
  "abaya homme": "عباية رجالي",
  "عباية رجالي": "عباية رجالي",
  "عباية رجالية": "عباية رجالي",

  jebba: "جبة",
  jebbah: "جبة",
  "جبة": "جبة",
  "جبّة": "جبة",
};

const normalizeKey = (v) => String(v || "").trim().toLowerCase();

const isNumericLike = (v) =>
  (typeof v === "string" || typeof v === "number") &&
  String(v).trim().match(/^\d+(\.\d+)?$/);

const safeNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const displayProductId = (p) =>
  String(p?.productId || p?._id || p?.id || p?.slug || "").trim();

/* =============================================================================
   Helpers
============================================================================= */
const translateToArabicIfNeeded = (label) => {
  if (!label) return label;

  const hasArabic = /[\u0600-\u06FF]/.test(label);
  if (hasArabic) {
    const ar = label.replace(/\s+/g, "");
    if (AR_TRANSLIT_MAP[ar]) return AR_TRANSLIT_MAP[ar];
    return label;
  }

  const k = normalizeKey(label);
  if (AR_FALLBACK_MAP[k]) return AR_FALLBACK_MAP[k];

  for (const key of Object.keys(AR_FALLBACK_MAP)) {
    if (k.includes(key)) return AR_FALLBACK_MAP[key];
  }

  return label;
};

const translateEmbroideryCategory = (value) => {
  if (!value) return "";

  const hasArabic = /[\u0600-\u06FF]/.test(value);
  if (hasArabic) return value;

  const key = normalizeKey(value);
  if (AR_EMBROIDERY_CATEGORY_MAP[key]) return AR_EMBROIDERY_CATEGORY_MAP[key];

  for (const baseKey of Object.keys(AR_EMBROIDERY_CATEGORY_MAP)) {
    if (key.includes(baseKey)) return AR_EMBROIDERY_CATEGORY_MAP[baseKey];
  }

  return value;
};

const translateSubCategory = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    const raw = value.ar || value.fr || value.en || "";
    return translateSubCategory(raw);
  }

  const raw = String(value).trim();
  if (!raw) return "";

  const key = normalizeKey(raw);
  if (AR_SUBCATEGORY_MAP[key]) return AR_SUBCATEGORY_MAP[key];

  for (const baseKey of Object.keys(AR_SUBCATEGORY_MAP)) {
    if (key.includes(baseKey)) return AR_SUBCATEGORY_MAP[baseKey];
  }

  return raw;
};

const ProductCard = ({ product, showStockBadge = true }) => {
  const lang = "ar";
  const baseLang = "ar";
  const isRTL = true;

  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 20 });

  if (!product) return null;

  const pid = displayProductId(product);
  const productUrl = pid ? `/products/${encodeURIComponent(pid)}` : "/products";

  const handleNavigateTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const rawEmbroideryValue = useMemo(() => {
    const ec = product?.embroideryCategory;
    if (!ec) return "";
    if (typeof ec === "string") return ec.trim();

    if (typeof ec === "object") {
      if (baseLang === "ar") return ec.ar || ec.fr || ec.en || "";
      if (baseLang === "fr") return ec.fr || ec.en || ec.ar || "";
      return ec.en || ec.fr || ec.ar || "";
    }

    return "";
  }, [product, baseLang]);

  const displayedEmbroideryCategory = useMemo(
    () => translateEmbroideryCategory(rawEmbroideryValue),
    [rawEmbroideryValue]
  );

  const displayedSubCategory = useMemo(() => {
    const sc = product?.subCategory;
    return translateSubCategory(sc);
  }, [product]);

  const displayName = useMemo(() => {
    const tAr = String(product?.translations?.ar?.title || "").trim();
    const tFr = String(product?.translations?.fr?.title || "").trim();
    const tEn = String(product?.translations?.en?.title || "").trim();
    const legacyTitle = String(product?.title || "").trim();

    return tAr || legacyTitle || tFr || tEn || displayedEmbroideryCategory || "منتج";
  }, [product, displayedEmbroideryCategory]);

  const description =
    product?.translations?.ar?.description ||
    product?.description ||
    product?.translations?.fr?.description ||
    product?.translations?.en?.description ||
    "";

  const firstColor = Array.isArray(product?.colors) ? product.colors[0] : undefined;

  const getColorLabel = (c) => {
    if (!c) return "";
    const candidates = [];

    if (c.translations && typeof c.translations === "object") {
      const tl = c.translations;
      candidates.push(
        tl?.[lang]?.name,
        tl?.[lang]?.colorName,
        tl?.[baseLang]?.name,
        tl?.[baseLang]?.colorName,
        tl?.en?.name,
        tl?.en?.colorName
      );
    }

    if (c.colorName && typeof c.colorName === "object") {
      candidates.push(c.colorName[lang], c.colorName[baseLang], c.colorName.en);
    }

    if (c.name && typeof c.name === "object") {
      candidates.push(c.name[lang], c.name[baseLang], c.name.en);
    }

    if (typeof c.name === "string") candidates.push(c.name);
    if (typeof c.colorName === "string") candidates.push(c.colorName);
    if (typeof c.title === "string") candidates.push(c.title);

    const raw =
      candidates.find((v) => typeof v === "string" && v.trim() && !isNumericLike(v)) ||
      "افتراضي";

    return translateToArabicIfNeeded(raw);
  };

  const displayedColor = getColorLabel(firstColor);

  const displayedStock = Math.max(
    0,
    safeNum(firstColor?.stock, safeNum(product?.stockQuantity, safeNum(product?.stock, 0)))
  );

  const isTrending = Boolean(
    product?.trending ||
      product?.isTrending ||
      product?.tags?.includes?.("trending") ||
      product?.labels?.includes?.("trending")
  );

  const ratingValue = Math.max(0, Math.min(5, safeNum(product?.rating, 0)));

  const renderStars = (value) =>
    Array.from({ length: 5 }).map((_, i) => {
      const filled = i < Math.round(value);
      return (
        <Star
          key={i}
          className={`pc-star ${filled ? "is-filled" : ""}`}
          aria-hidden="true"
        />
      );
    });

  const stockText = displayedStock > 0 ? `الكمية المتوفرة: ${displayedStock}` : "غير متوفر";

  const handleMouseMove = (e) => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  return (
    <article className="pc-card" dir={isRTL ? "rtl" : "ltr"}>
      <Link
        to={productUrl}
        onClick={handleNavigateTop}
        className="pc-mediaLink"
        aria-label={displayName}
      >
        <div className="pc-media">
          {isTrending && <span className="pc-badge pc-badge--trend">رائج</span>}

          {showStockBadge && (
            <span
              className={`pc-badge pc-badge--stock ${displayedStock > 0 ? "is-in" : "is-out"}`}
              title={stockText}
              aria-label={stockText}
            >
              {displayedStock > 0 ? `${displayedStock}+` : "نفد"}
            </span>
          )}

          {pid && (
            <span className="pc-mediaId" dir="ltr">
              #{pid}
            </span>
          )}

          <img
            src={getImgUrl(product?.coverImage)}
            alt={displayName}
            loading="lazy"
            onMouseMove={handleMouseMove}
            className="pc-image"
            style={{
              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
            }}
          />

          <div className="pc-mediaShade" />
        </div>
      </Link>

      <div className="pc-body">
        <div className="pc-topMeta">
          {pid && (
            <div className="pc-idLine" dir="ltr" title={pid}>
              <span className="pc-idLabel">ID</span>
              <span className="pc-idValue">#{pid}</span>
            </div>
          )}

          {displayedSubCategory && displayedSubCategory !== "الكل" && (
            <div className="pc-chip">{displayedSubCategory}</div>
          )}
        </div>

        <Link to={productUrl} onClick={handleNavigateTop} className="pc-titleLink">
          <h3 className="pc-title">{displayName}</h3>
        </Link>

        <div className="pc-ratingRow">
          <div className="pc-stars">{renderStars(ratingValue)}</div>
          <span className="pc-ratingText">{ratingValue.toFixed(1)}/5</span>
        </div>

        {displayedEmbroideryCategory && (
          <p className="pc-metaLine">
            <span className="pc-metaLabel">نوع التطريز:</span>
            <span className="pc-metaValue">{displayedEmbroideryCategory}</span>
          </p>
        )}

        {displayedColor && (
          <p className="pc-metaLine">
            <span className="pc-metaLabel">اللون:</span>
            <span className="pc-metaValue">{displayedColor}</span>
          </p>
        )}

        {description && (
          <p className="pc-description">
            {description.length > 92 ? `${description.slice(0, 92)}…` : description}
          </p>
        )}

        {Array.isArray(product?.colors) && product.colors.length > 0 && (
          <div className="pc-swatchesWrap">
            {product.colors.slice(0, 5).map((c, idx) => (
              <span
                key={`${pid || "product"}-clr-${idx}`}
                className="pc-swatchesTag"
                title={getColorLabel(c)}
              >
                {getColorLabel(c)}
              </span>
            ))}

            {product.colors.length > 5 && (
              <span className="pc-swatchesMore">+{product.colors.length - 5}</span>
            )}
          </div>
        )}

        <Link to={productUrl} onClick={handleNavigateTop} className="pc-action">
          عرض التفاصيل
        </Link>
      </div>
    </article>
  );
};

export default ProductCard;