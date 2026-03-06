// src/components/Selector.jsx
import React, { useMemo } from "react";
import "../Styles/StylesSelector.css";

/* Canonical keys for categories */
const DEFAULT_OPTIONS = ["all", "men", "women", "children"];

/* ✅ Arabic labels for known keys */
const AR_CATEGORY_LABELS = {
  all: "الكل",
  men: "رجال",
  women: "نساء",
  children: "أطفال",

  // ✅ NEW
  accessories: "إكسسوارات",
  costume: "بدلة",
  vest: "صدريّة",
  mens_abaya: "عباية رجالي",
  jebba: "جبّة",
};

function normalizeOption(opt) {
  // String case
  if (typeof opt === "string") {
    const key = opt.toLowerCase();
    const label = AR_CATEGORY_LABELS[key] || opt;
    const value = key === "all" ? "" : opt; // "" means ALL
    return { key, value, label };
  }

  // Object case
  if (opt && typeof opt === "object") {
    const rawVal = opt.value ?? opt.key ?? "";
    const key = String(rawVal).toLowerCase();
    const value = key === "all" ? "" : rawVal;
    const label =
      (typeof opt.label === "string" && opt.label.trim()) ||
      AR_CATEGORY_LABELS[key] ||
      String(rawVal || "");
    return { key, value, label };
  }

  // Fallback
  const v = String(opt ?? "");
  return { key: v.toLowerCase(), value: v, label: v };
}

export default function Selector({ onSelect, label, options = DEFAULT_OPTIONS, value = "" }) {
  const normalized = useMemo(() => {
    const mapped = options.map(normalizeOption);
    const seen = new Set();
    return mapped.filter((opt) => {
      if (seen.has(opt.key)) return false;
      seen.add(opt.key);
      return true;
    });
  }, [options]);

  return (
    <div className="selector" dir="rtl">
      {label && (
        <label className="selector__label" htmlFor="category-select">
          {label}
        </label>
      )}

      <div className="selector__field">
        <span aria-hidden className="selector__halo" />
        <span aria-hidden className="selector__underline" />

        <select
          id="category-select"
          value={value}
          onChange={(e) => onSelect?.(e.target.value)}
          className="selector__control"
        >
          {normalized.map(({ key, value: val, label: text }) => (
            <option key={key} value={val}>
              {text}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}