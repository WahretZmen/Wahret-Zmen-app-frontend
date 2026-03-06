// src/pages/home/OurSellers.jsx
import React, { useMemo, useState, useEffect } from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

import { useGetAllProductsQuery } from "../../redux/features/products/productsApi";
import ProductCard from "../products/ProductCard";
import Selector from "../../components/Selector.jsx";

import FadeInSection from "../../Animations/FadeInSection.jsx";
import ScrollFade from "../../Animations/ScrollFade.jsx";

import "../../Styles/StylesOurSellers.css";

/* Always RTL for this section */
const isRTL = true;

/* Category keys order for "All" view */
const CATEGORY_ORDER = { men: 1, women: 2, children: 3 };

/* ✅ Category selector (1st) */
const CATEGORY_OPTIONS_AR = [
  { value: "", label: "الكل" },
  { value: "Men", label: "رجال" },
  { value: "Women", label: "نساء" },
  { value: "Children", label: "أطفال" },
];

/* ✅ Sub Category selector (2nd) — Arabic labels */
const SUBCATEGORY_OPTIONS_AR = [
  { value: "", label: "الكل" },
  { value: "accessoires", label: "إكسسوارات" },
  { value: "costume", label: "بدلة" },
  { value: "صدريّة", label: "صدريّة" },
  { value: "عباية رجالي", label: "عباية رجالي" },
  { value: "جبة", label: "جبة" },
];

const responsive = {
  superLargeDesktop: { breakpoint: { max: 4000, min: 1400 }, items: 3, slidesToSlide: 1 },
  desktop: { breakpoint: { max: 1400, min: 1024 }, items: 3, slidesToSlide: 1 },
  tablet: { breakpoint: { max: 1024, min: 768 }, items: 2, slidesToSlide: 1 },
  mobile: { breakpoint: { max: 768, min: 0 }, items: 1, slidesToSlide: 1 },
};

const SECTION_TITLE = "مجموعة وهرة زمان";
const SELECT_CATEGORY_LABEL = "اختر الفئة";
const SELECT_SUBCATEGORY_LABEL = "اختر الفئة الفرعية";
const PREVIOUS_LABEL = "السابق";
const NEXT_LABEL = "التالي";
const NO_PRODUCTS_TEXT = "لا توجد منتجات حالياً.";

const norm = (s = "") => String(s).trim().toLowerCase();

/* Normalize category values from backend */
const canonicalCategory = (raw) => {
  const k = norm(raw);
  if (!k) return "";
  if (["men", "homme", "hommes", "رجال"].includes(k)) return "men";
  if (["women", "femme", "femmes", "نساء"].includes(k)) return "women";
  if (["children", "kid", "kids", "enfant", "enfants", "أطفال"].includes(k)) return "children";
  return k;
};

/* Subcategory getter (supports many possible keys) */
const pickText = (v) => {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object") return String(v.ar || v.fr || v.en || "").trim();
  return "";
};

const getProductSubCategory = (p) => {
  const raw =
    p?.subCategory ??
    p?.subcategory ??
    p?.sub_category ??
    p?.subCat ??
    p?.sub_cat ??
    p?.subcategorie ??
    p?.sub_categorie ??
    p?.subCategoryName;

  return pickText(raw);
};

const OurSellers = () => {
  // 1st selector: category
  const [selectedCategory, setSelectedCategory] = useState("");

  // 2nd selector: sub category
  const [selectedSubCategory, setSelectedSubCategory] = useState("");

  const { data: products = [] } = useGetAllProductsQuery(undefined, {
    pollingInterval: 5000,
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    // Optional: reset sub category when category changes
    // setSelectedSubCategory("");
  }, [selectedCategory]);

  // Filter + sort
  const filteredProducts = useMemo(() => {
    const selCatNorm = canonicalCategory(selectedCategory);

    const base =
      selectedCategory === ""
        ? [...products].sort((a, b) => {
            return (
              (CATEGORY_ORDER[canonicalCategory(a?.category)] || 99) -
              (CATEGORY_ORDER[canonicalCategory(b?.category)] || 99)
            );
          })
        : products.filter((p) => canonicalCategory(p?.category) === selCatNorm);

    if (!selectedSubCategory) return base;

    const selSubNorm = norm(selectedSubCategory);
    return base.filter((p) => norm(getProductSubCategory(p)) === selSubNorm);
  }, [products, selectedCategory, selectedSubCategory]);

  // Carousel arrow button
  const Arrow = ({ onClick, type }) => {
    const icon = type === "prev" ? "‹" : "›";

    return (
      <button
        type="button"
        className={`wz-arrow ${type === "prev" ? "wz-prev" : "wz-next"}`}
        onClick={onClick}
        aria-label={type === "prev" ? PREVIOUS_LABEL : NEXT_LABEL}
      >
        <span className="wz-arrow-icon">{icon}</span>
      </button>
    );
  };

  return (
    <FadeInSection>
      <div className="our-sellers-wrapper" dir={isRTL ? "rtl" : "ltr"}>
        <section className="our-sellers-section" aria-label={SECTION_TITLE}>
          <div className="our-sellers-container">
            {/* Title */}
            <ScrollFade direction="right" delay={0}>
              <h2 className="text-4xl text-[#5a382d] font-bold mb-6 text-center tracking-wide our-sellers-title os-title">
                <span className="os-title__text">{SECTION_TITLE}</span>
              </h2>
            </ScrollFade>

            {/* ✅ BOTH SELECTORS ON SAME LINE (desktop), stacked on mobile */}
            <div className="w-full flex flex-col md:flex-row items-stretch md:items-end justify-center gap-4 md:gap-6 mb-6 px-2 sm:px-0">
              {/* 1) Category */}
              <div className="w-full md:w-[320px] flex flex-col items-center">
                <h3 className="select-category-title text-lg sm:text-xl font-semibold text-[#5a382d] mb-2 text-center">
                  {SELECT_CATEGORY_LABEL}
                </h3>
                <div className="w-full">
                  <Selector
                    options={CATEGORY_OPTIONS_AR}
                    value={selectedCategory}
                    onSelect={setSelectedCategory}
                  />
                </div>
              </div>

              {/* 2) Sub Category */}
              <div className="w-full md:w-[320px] flex flex-col items-center">
                <h3 className="select-category-title text-lg sm:text-xl font-semibold text-[#5a382d] mb-2 text-center">
                  {SELECT_SUBCATEGORY_LABEL}
                </h3>
                <div className="w-full">
                  <Selector
                    options={SUBCATEGORY_OPTIONS_AR}
                    value={selectedSubCategory}
                    onSelect={setSelectedSubCategory}
                  />
                </div>
              </div>
            </div>

            {/* Carousel */}
            <div className="max-w-6xl mx-auto px-2 sm:px-4">
              {filteredProducts.length > 0 ? (
                <div className="carousel-clip custom-carousel">
                  <Carousel
                    responsive={responsive}
                    autoPlay
                    autoPlaySpeed={3000}
                    infinite
                    swipeable
                    draggable
                    keyBoardControl
                    customTransition="transform 350ms ease"
                    arrows
                    showDots={false}
                    containerClass="rmc-list"
                    sliderClass="rmc-track"
                    itemClass="rmc-item"
                    customLeftArrow={<Arrow type="prev" />}
                    customRightArrow={<Arrow type="next" />}
                    rtl={isRTL}
                  >
                    {filteredProducts.map((product, index) => (
                      <FadeInSection
                        key={product?._id || index}
                        delay={index * 0.1}
                        duration={0.6}
                        yOffset={30}
                      >
                        <div className="carousel-card-wrapper">
                          <ProductCard product={product} showCounter={false} />
                        </div>
                      </FadeInSection>
                    ))}
                  </Carousel>
                </div>
              ) : (
                <p className="text-center text-[#5a382d] text-lg">{NO_PRODUCTS_TEXT}</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </FadeInSection>
  );
};

export default OurSellers;