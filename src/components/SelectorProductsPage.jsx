// src/pages/SelectorPageProducts.jsx
// -----------------------------------------------------------------------------
// Filter sidebar (category + double price range) with:
// - Canonicalized category aliases (EN/FR/AR)
// - i18n fallbacks
// - RTL support
// - Dual range UI: MIN (top) + MAX (bottom)
// -----------------------------------------------------------------------------

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Filter } from "lucide-react";
import "../Styles/StylesSelectorProductsPage.css";

/* =============================================================================
   🔤 Canonicalization: map any alias → canonical key used in state/UI
============================================================================= */
const CANONICAL = {
  // All
  all: "All",
  tous: "All",
  "الكل": "All",

  // EN
  men: "Men",
  women: "Women",
  children: "Children",
  kids: "Children",
  kid: "Children",

  // FR
  hommes: "Men",
  homme: "Men",
  femmes: "Women",
  femme: "Women",
  enfants: "Children",
  enfant: "Children",

  // AR
  "رجال": "Men",
  "نساء": "Women",
  "أطفال": "Children",
};

const FALLBACKS = {
  ar: { all: "الكل", men: "رجال", women: "نساء", children: "أطفال" },
  fr: { all: "Tous", men: "Hommes", women: "Femmes", children: "Enfants" },
  en: { all: "All", men: "Men", women: "Women", children: "Children" },
};

const normalize = (v) => (v || "").toString().trim().toLowerCase();

function canonicalizeCategory(raw) {
  if (raw == null) return "";
  const k = normalize(raw);
  return CANONICAL[k] || raw;
}

function localFallback(opt, lang) {
  const key = normalize(opt);
  const short = (lang || "en").split("-")[0];
  return FALLBACKS[short]?.[key] ?? FALLBACKS.en[key] ?? String(opt);
}

/* =============================================================================
   🧰 Component
============================================================================= */
const SelectorPageProducts = ({
  categorySel,
  setCategorySel,
  categories,
  colorSel,
  setColorSel,
  colors,
  priceRange,
  setPriceRange,
  minPrice,
  maxPrice,
  clearFilters,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n?.language || "en";
  const isRTL = lang === "ar" || lang === "ar-SA" || lang.startsWith("ar");

  /* ---------------------------------------------------------------------------
     Normalize & dedupe categories, ensure "All" exists and is first
  --------------------------------------------------------------------------- */
  const normalizedCategories = useMemo(() => {
    const seen = new Set();
    const canonList = [];

    for (const c of categories || []) {
      const canon = canonicalizeCategory(c);
      const k = String(canon);
      if (!seen.has(k)) {
        seen.add(k);
        canonList.push(canon);
      }
    }

    if (!seen.has("All")) {
      canonList.unshift("All");
    } else {
      const withoutAll = canonList.filter((x) => x !== "All");
      canonList.splice(0, canonList.length, "All", ...withoutAll);
    }

    return canonList;
  }, [categories]);

  // Localized category label with fallback
  const catText = (c) =>
    t(`categories.${String(c).toLowerCase()}`, {
      defaultValue: localFallback(c, lang),
    });

  // Always show canonical selection (default to "All")
  const selectedCategoryForUI = canonicalizeCategory(categorySel || "All");

  const onCategoryChange = (e) => {
    const picked = canonicalizeCategory(e.target.value);
    // IMPORTANT: keep canonical value in state; don't set "" for All
    setCategorySel(picked);
  };

  /* ---------------------------------------------------------------------------
     Clamp ranges to avoid min > max during quick drags
  --------------------------------------------------------------------------- */
  const clampMin = Math.min(Math.max(minPrice, priceRange[0]), priceRange[1]);
  const clampMax = Math.max(Math.min(maxPrice, priceRange[1]), priceRange[0]);

  /* ---------------------------------------------------------------------------
     Render
  --------------------------------------------------------------------------- */
  return (
    <aside className="filters-sidebar" dir={isRTL ? "rtl" : "ltr"}>
      <div className="filters-card">
        {/* Header */}
        <div className="filters-header">
          <h3 className="filters-title">{t("filters", "الفلاتر")}</h3>
          <Filter className="icon" aria-hidden="true" />
        </div>

        {/* Category */}
        <div className="filter-group">
          <label className="filter-label" htmlFor="category-select">
            {t("category", "الفئة")}
          </label>
          <select
            id="category-select"
            className="filter-select"
            value={selectedCategoryForUI}
            onChange={onCategoryChange}
          >
            {normalizedCategories.map((c) => (
              <option key={c} value={c}>
                {catText(c)}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div className="filter-group">
          <label className="filter-label">{t("price_range", "نطاق السعر")}</label>

          {/* Numeric inputs */}
          <div className="price-row" role="group" aria-label={t("price_range", "نطاق السعر")}>
            <div className="price-field">
              <span className="currency">$</span>
              <input
                aria-label={t("min_price", "أقل سعر")}
                type="number"
                min={minPrice}
                max={clampMax}
                value={Math.round(clampMin)}
                onChange={(e) =>
                  setPriceRange([Number(e.target.value) || minPrice, clampMax])
                }
                inputMode="decimal"
              />
            </div>

            <span className="dash" aria-hidden="true">—</span>

            <div className="price-field">
              <span className="currency">$</span>
              <input
                aria-label={t("max_price", "أعلى سعر")}
                type="number"
                min={clampMin}
                max={maxPrice}
                value={Math.round(clampMax)}
                onChange={(e) =>
                  setPriceRange([clampMin, Number(e.target.value) || maxPrice])
                }
                inputMode="decimal"
              />
            </div>
          </div>

          {/* Dual sliders */}
          <div className="range-wrap double" aria-hidden="false">
            <input
              className="range line first"
              type="range"
              min={minPrice}
              max={maxPrice}
              step="1"
              value={clampMin}
              onChange={(e) => {
                const nextMin = Math.min(Number(e.target.value), clampMax);
                setPriceRange([nextMin, clampMax]);
              }}
            />
            <input
              className="range line second"
              type="range"
              min={minPrice}
              max={maxPrice}
              step="1"
              value={clampMax}
              onChange={(e) => {
                const nextMax = Math.max(Number(e.target.value), clampMin);
                setPriceRange([clampMin, nextMax]);
              }}
            />
          </div>

          {/* Endpoints caption */}
          <div className="range-ends">
            <span>${Math.round(minPrice)}</span>
            <span>${Math.round(maxPrice)}</span>
          </div>
        </div>

        {/* Clear Filters */}
        <button
          type="button"
          className="btn-outline w-full"
          onClick={clearFilters}
          aria-label={t("clear_filters", "مسح الفلاتر")}
        >
          {t("clear_filters", "مسح الفلاتر")}
        </button>
      </div>
    </aside>
  );
};

export default SelectorPageProducts;
