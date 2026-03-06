// src/components/SelectorProductsPage.jsx

import React, { useMemo } from "react";
import { Filter } from "lucide-react";
import "../Styles/StylesSelectorProductsPage.css";

// Map different aliases of categories (FR / AR / EN) to one canonical value
const CANONICAL = {
  all: "All",
  tous: "All",
  "الكل": "All",

  men: "Men",
  women: "Women",
  children: "Children",
  kids: "Children",
  kid: "Children",

  hommes: "Men",
  homme: "Men",
  femmes: "Women",
  femme: "Women",
  enfants: "Children",
  enfant: "Children",

  رجال: "Men",
  نساء: "Women",
  أطفال: "Children",
};

const normalize = (v) => (v || "").toString().trim().toLowerCase();
const normStr = (s) => String(s ?? "").trim();

function canonicalizeCategory(raw) {
  if (raw == null) return "";
  const k = normalize(raw);
  return CANONICAL[k] || raw;
}

// Arabic label for canonical categories
function categoryLabel(canon) {
  const key = normalize(canon);
  if (key === "all") return "الكل";
  if (key === "men") return "رجال";
  if (key === "women") return "نساء";
  if (key === "children") return "أطفال";
  return canon;
}

/* SubCategory stored keys -> Arabic labels */
const SUB_LABELS_AR = {
  All: "الكل",
  accessories: "إكسسوارات",
  costume: "بدلة",
  vest: "صدريّة",
  mens_abaya: "عباية رجالي",
  jebba: "جبة",
};

const SUBCATEGORY_ALIAS_TO_KEY = {
  all: "All",
  "الكل": "All",

  accessories: "accessories",
  accessory: "accessories",
  accessoires: "accessories",
  "إكسسوارات": "accessories",
  اكسسوارات: "accessories",

  costume: "costume",
  suit: "costume",
  "بدلة": "costume",
  بدلة: "costume",

  vest: "vest",
  gilet: "vest",
  "صدريّة": "vest",
  "صدرية": "vest",
  صدريّة: "vest",
  صدرية: "vest",

  mens_abaya: "mens_abaya",
  "mens abaya": "mens_abaya",
  "men abaya": "mens_abaya",
  "abaya homme": "mens_abaya",
  "عباية رجالي": "mens_abaya",
  "عباية رجالية": "mens_abaya",

  jebba: "jebba",
  jebbah: "jebba",
  "جبة": "jebba",
  "جبّة": "jebba",
};

const canonicalizeSubCategory = (raw) => {
  const key = normalize(raw);
  return SUBCATEGORY_ALIAS_TO_KEY[key] || normStr(raw) || "";
};

const subLabel = (key) => SUB_LABELS_AR[key] || key;

const SelectorPageProducts = ({
  categorySel,
  setCategorySel,
  categories,

  subCategorySel,
  setSubCategorySel,
  subCategories,

  colorSel,
  setColorSel,
  colors,

  embroiderySel,
  setEmbroiderySel,
  embroideryTypes,

  priceRange,
  setPriceRange,
  minPrice,
  maxPrice,

  clearFilters,
}) => {
  const isRTL = true;

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

  const normalizedSubCategories = useMemo(() => {
    const list = [];
    const seen = new Set();

    const push = (v) => {
      const key = canonicalizeSubCategory(v);
      if (!key || seen.has(key)) return;
      seen.add(key);
      list.push(key);
    };

    for (const s of subCategories || []) push(s);

    if (!seen.has("All")) {
      return ["All", ...list];
    }

    const withoutAll = list.filter((x) => x !== "All");
    return ["All", ...withoutAll];
  }, [subCategories]);

  const normalizedEmbroideryTypes = useMemo(() => {
    const seen = new Set();
    const list = [];

    const pushPack = (value, pack) => {
      const key = normStr(value);
      if (!key || seen.has(key)) return;
      seen.add(key);
      list.push({ value: key, pack });
    };

    for (const e of embroideryTypes || []) {
      if (!e) continue;

      if (typeof e === "object") {
        const en = normStr(e.en || e.fr || e.ar);
        const fr = normStr(e.fr || en || e.ar);
        const ar = normStr(e.ar || e.fr || en);
        const key = en || fr || ar;
        if (!key) continue;
        pushPack(key, { en: key, fr: fr || key, ar: ar || key });
      } else if (typeof e === "string") {
        const s = normStr(e);
        if (!s) continue;
        pushPack(s, { en: s, fr: s, ar: s });
      }
    }

    if (!seen.has("All")) {
      pushPack("All", { en: "All", fr: "Tous", ar: "الكل" });
    } else {
      const others = list.filter((x) => x.value !== "All");
      const allOpt = list.find((x) => x.value === "All");
      return [allOpt, ...others];
    }

    return list;
  }, [embroideryTypes]);

  const embroideryLabel = (pack) => pack.ar || pack.fr || pack.en;

  const selectedCategoryForUI = canonicalizeCategory(categorySel || "All");
  const selectedEmbroideryForUI = normStr(embroiderySel || "All") || "All";
  const selectedSubForUI = canonicalizeSubCategory(subCategorySel || "All") || "All";

  const onCategoryChange = (e) => {
    const picked = canonicalizeCategory(e.target.value);
    setCategorySel(picked);
  };

  const onEmbroideryChange = (e) => {
    const picked = e.target.value || "All";
    setEmbroiderySel(picked);
  };

  const onSubCategoryChange = (e) => {
    const picked = canonicalizeSubCategory(e.target.value || "All");
    setSubCategorySel?.(picked);
  };

  const clampMin = Math.min(Math.max(minPrice, priceRange[0]), priceRange[1]);
  const clampMax = Math.max(Math.min(maxPrice, priceRange[1]), priceRange[0]);

  const showSub =
    typeof setSubCategorySel === "function" &&
    Array.isArray(subCategories) &&
    subCategories.length > 0;

  return (
    <aside className="filters-sidebar" dir={isRTL ? "rtl" : "ltr"}>
      <div className="filters-card">
        <div className="filters-header">
          <h3 className="filters-title">الفلاتر</h3>
          <Filter className="icon" aria-hidden="true" />
        </div>

        {/* Category */}
        <div className="filter-group">
          <label className="filter-label" htmlFor="category-select">
            الفئة
          </label>
          <select
            id="category-select"
            className="filter-select"
            value={selectedCategoryForUI}
            onChange={onCategoryChange}
          >
            {normalizedCategories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </div>

        {/* SubCategory */}
        {showSub && (
          <div className="filter-group">
            <label className="filter-label" htmlFor="subcategory-select">
              نوع القطعة
            </label>
            <select
              id="subcategory-select"
              className="filter-select"
              value={selectedSubForUI}
              onChange={onSubCategoryChange}
            >
              {normalizedSubCategories.map((s) => (
                <option key={s} value={s}>
                  {subLabel(s)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Embroidery type */}
        {normalizedEmbroideryTypes.length > 0 && (
          <div className="filter-group">
            <label className="filter-label" htmlFor="embroidery-select">
              نوع التطريز
            </label>
            <select
              id="embroidery-select"
              className="filter-select"
              value={selectedEmbroideryForUI}
              onChange={onEmbroideryChange}
            >
              {normalizedEmbroideryTypes.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value === "All" ? "الكل" : embroideryLabel(opt.pack)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Price Range */}
        <div className="filter-group">
          <label className="filter-label">نطاق السعر</label>

          <div className="price-row" role="group" aria-label="نطاق السعر">
            <div className="price-field">
              <span className="currency">د.ت</span>
              <input
                aria-label="أقل سعر"
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

            <span className="dash" aria-hidden="true">
              —
            </span>

            <div className="price-field">
              <span className="currency">د.ت</span>
              <input
                aria-label="أعلى سعر"
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

          <div className="range-ends">
            <span>د.ت {Math.round(minPrice)}</span>
            <span>د.ت {Math.round(maxPrice)}</span>
          </div>
        </div>

        <button
          type="button"
          className="btn-outline w-full"
          onClick={clearFilters}
          aria-label="مسح الفلاتر"
        >
          مسح الفلاتر
        </button>
      </div>
    </aside>
  );
};

export default SelectorPageProducts;