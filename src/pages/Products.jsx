// src/pages/Products.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import ProductCard from "./products/ProductCard.jsx";
import SearchInput from "../components/SearchInput.jsx";
import SelectorPageProducts from "../components/SelectorProductsPage.jsx";

import { useGetAllProductsQuery } from "../redux/features/products/productsApi.js";
import { productEventsActions } from "../redux/features/products/productEventsSlice.js";

import FadeInSection from "../Animations/FadeInSection";

import "../Styles/StylesProducts.css";
import "../Styles/StylesSelectorProductsPage.css";

/* ---------------------------
   Helpers
--------------------------- */
const normalize = (v) => (v || "").toString().trim().toLowerCase();

const capitalize = (s) => {
  const n = String(s || "");
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : "";
};

/* ✅ CATEGORY is ONLY Men/Women/Children */
const CATEGORY_ALIAS_TO_UI = {
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

const UI_TO_URL_CATEGORY = {
  Men: "men",
  Women: "women",
  Children: "children",
  All: "",
};

const canonicalCategory = (raw) => {
  const n = normalize(raw);
  return CATEGORY_ALIAS_TO_UI[n] || capitalize(n) || "";
};

const mapURLCategoryToUI = (raw) => {
  const v = normalize(raw);
  if (!v) return "All";
  if (v === "women") return "Women";
  if (v === "men") return "Men";
  if (v === "children" || v === "kids" || v === "kid") return "Children";
  return CATEGORY_ALIAS_TO_UI[v] || "All";
};

const uiCategoryToUrl = (ui) => UI_TO_URL_CATEGORY[ui] ?? "";

/* ✅ Fixed Sub Categories list (Arabic labels) */
const SUBCATEGORY_OPTIONS = [
  { value: "All", label: "الكل" },
  { value: "إكسسوارات", label: "إكسسوارات" },
  { value: "بدلة", label: "بدلة" },
  { value: "صدريّة", label: "صدريّة" },
  { value: "عباية رجالي", label: "عباية رجالي" },
  { value: "جبة", label: "جبة" },
];

/* ✅ Subcategory text (string OR {ar,fr,en}) + supports many field names */
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

const numericPrice = (p) => {
  const raw =
    p?.newPrice ??
    p?.price ??
    p?.pricing ??
    (typeof p?.prices?.current === "number" ? p.prices.current : undefined);

  const n = Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const productColorNames = (p) => {
  if (Array.isArray(p?.colors)) {
    return p.colors
      .map(
        (c) =>
          c?.colorName?.en ||
          c?.colorName?.fr ||
          c?.colorName?.ar ||
          c?.colorName ||
          c?.name ||
          c?.label
      )
      .filter(Boolean);
  }
  if (p?.color) return [p.color];
  return [];
};

const getEmbroideryLabel = (emb) => {
  if (!emb) return "";
  if (typeof emb === "string") return emb.trim();
  if (typeof emb === "object") return String(emb.ar || emb.fr || emb.en || "").trim();
  return "";
};

/* ---------------------------
   Component
--------------------------- */
const Products = () => {
  const LOAD_STEP = 8;

  // Filters
  const [categorySel, setCategorySel] = useState("All");
  const [subCategorySel, setSubCategorySel] = useState("All");
  const [colorSel, setColorSel] = useState("All");
  const [embroiderySel, setEmbroiderySel] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 1000]);

  // Search + visible items
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(LOAD_STEP);

  // UI states
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Prevent URL sync loop
  const isSyncingFromURL = useRef(false);

  // Fetch
  const {
    data: products = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetAllProductsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });

  // Refetch after admin changes
  const shouldRefetch = useSelector((state) => state.productEvents.shouldRefetch);
  useEffect(() => {
    if (shouldRefetch) {
      refetch();
      dispatch(productEventsActions.resetRefetch());
    }
  }, [shouldRefetch, refetch, dispatch]);

  // Smooth top on route/query changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [location.pathname, location.search]);

  // Read URL params (category/search/sub) => UI state
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const rawCat = params.get("category");
    const rawQ = params.get("search") || params.get("q") || "";
    const rawSub = params.get("sub") || params.get("subcategory") || "";

    isSyncingFromURL.current = true;

    setCategorySel(mapURLCategoryToUI(rawCat));
    setSearchTerm(rawQ);

    const subVal = rawSub ? rawSub : "All";
    const isAllowed =
      subVal === "All" ||
      SUBCATEGORY_OPTIONS.some((o) => normalize(o.value) === normalize(subVal));
    setSubCategorySel(isAllowed ? subVal : "All");

    setVisibleCount(LOAD_STEP);

    const t = setTimeout(() => (isSyncingFromURL.current = false), 0);
    return () => clearTimeout(t);
  }, [location.search]);

  // Push category + subcategory to URL
  useEffect(() => {
    if (isSyncingFromURL.current) return;

    const params = new URLSearchParams(location.search);

    // category
    const urlCat = uiCategoryToUrl(categorySel);
    if (!urlCat) params.delete("category");
    else params.set("category", urlCat);

    // subcategory
    if (!subCategorySel || subCategorySel === "All") {
      params.delete("sub");
      params.delete("subcategory");
    } else {
      params.set("sub", subCategorySel);
    }

    navigate({ search: params.toString() }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySel, subCategorySel]);

  // Search debounce
  const handleSearchChange = (term) => {
    setSearchLoading(true);
    const id = setTimeout(() => {
      setSearchTerm(term);
      setSearchLoading(false);
      setVisibleCount(LOAD_STEP);
    }, 300);

    return () => clearTimeout(id);
  };

  // Build options for right sidebar
  const { categories, colors, minPrice, maxPrice, embroideryTypes } = useMemo(() => {
    const catSet = new Set(["All", "Men", "Women", "Children"]);
    const colorSet = new Set(["All"]);
    const embroideryList = [];

    let minP = Number.POSITIVE_INFINITY;
    let maxP = 0;

    for (const p of products) {
      const canon = canonicalCategory(p?.category);
      if (canon) catSet.add(canon);

      for (const c of productColorNames(p)) {
        if (c) colorSet.add(capitalize(normalize(c)));
      }

      const embLabel = getEmbroideryLabel(p?.embroideryCategory);
      if (embLabel) embroideryList.push(p.embroideryCategory);

      const pr = numericPrice(p);
      if (pr > 0) {
        if (pr < minP) minP = pr;
        if (pr > maxP) maxP = pr;
      }
    }

    if (!Number.isFinite(minP)) minP = 0;
    if (maxP < minP) maxP = minP + 500;

    return {
      categories: Array.from(catSet),
      colors: Array.from(colorSet),
      minPrice: Math.floor(minP),
      maxPrice: Math.ceil(maxP),
      embroideryTypes: embroideryList,
    };
  }, [products]);

  // Keep price range safe
  useEffect(() => {
    setPriceRange(([lo, hi]) => {
      const next = [
        Math.max(minPrice, lo ?? minPrice),
        Math.min(maxPrice, hi ?? maxPrice),
      ];
      return next[0] > next[1] ? [minPrice, maxPrice] : next;
    });
  }, [minPrice, maxPrice]);

  // Reset visible when filters change
  useEffect(() => {
    setVisibleCount(LOAD_STEP);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySel, subCategorySel, colorSel, embroiderySel, priceRange]);

  // Filter products
  const matched = useMemo(() => {
    const q = normalize(searchTerm);
    const sel = canonicalCategory(categorySel) || "All";
    const subSel = normalize(subCategorySel || "All");
    const embroideryFilter = normalize(embroiderySel || "All");

    return products.filter((p) => {
      const catOfProduct = canonicalCategory(p?.category);
      const catOk = sel === "All" || catOfProduct === sel;

      // Sub category
      const subOfProduct = getProductSubCategory(p);
      const subOk = subSel === "all" || !subSel ? true : normalize(subOfProduct) === subSel;

      const pColors = productColorNames(p).map((c) => normalize(c));
      const colorOk = colorSel === "All" || pColors.includes(normalize(colorSel));

      const pr = numericPrice(p);
      const priceOk = pr >= priceRange[0] && pr <= priceRange[1];

      const embroideryText = getEmbroideryLabel(p?.embroideryCategory);
      const embroideryOk =
        !embroideryFilter ||
        embroideryFilter === "all" ||
        normalize(embroideryText).includes(embroideryFilter);

      const pid = String(p?.productId || "");
      const searchPool = [pid, embroideryText, catOfProduct, subOfProduct, ...productColorNames(p)]
        .filter(Boolean)
        .map((t) => normalize(t));

      const searchOk = !q || searchPool.some((t) => t.includes(q));

      return catOk && subOk && colorOk && priceOk && embroideryOk && searchOk;
    });
  }, [products, categorySel, subCategorySel, colorSel, priceRange, searchTerm, embroiderySel]);

  // Visible slice
  const filtered = useMemo(() => matched.slice(0, visibleCount), [matched, visibleCount]);

  // Load more
  const handleLoadMore = () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    setTimeout(() => {
      setVisibleCount((prev) => prev + LOAD_STEP);
      setIsLoadingMore(false);
    }, 650);
  };

  // Clear filters
  const clearFilters = () => {
    setCategorySel("All");
    setSubCategorySel("All");
    setColorSel("All");
    setEmbroiderySel("All");
    setPriceRange([minPrice, maxPrice]);
    setSearchTerm("");
    setVisibleCount(LOAD_STEP);

    const params = new URLSearchParams(location.search);
    params.delete("category");
    params.delete("sub");
    params.delete("subcategory");
    params.delete("search");
    params.delete("q");
    navigate({ search: params.toString() }, { replace: true });
  };

  // Initial loader
  if (isLoading || isFetching) {
    return (
      <div className="wz-products-firstLoad" dir="rtl">
        <div className="wz-firstLoadCard">
          <span className="wz-btnSpinner" aria-hidden="true" />
          <p className="wz-firstLoadText">جاري تحميل المنتجات…</p>
        </div>
      </div>
    );
  }

  return (
    <FadeInSection>
      <div className="main-content">
        <div className="container mx-auto pt-8 sm:pt-12 md:pt-16 pb-4 px-4 sm:px-6 md:px-10 lg:px-20 max-w-[1440px]">
          <Helmet>
            <title>المنتجات - Wahret Zmen</title>
          </Helmet>

          <header className="wz-collections-header" dir="rtl">
            <h1 className="wz-collections-title premium-gradient">مجموعة المنتجات</h1>
            <p className="wz-collections-sub">
              اكتشف أحدث تشكيلات الجبّة، القفطان والأزياء التقليدية من وهرة زمان،
              واختر الموديل الذي يناسب ذوقك ومناسباتك.
            </p>
          </header>

          {/* Search */}
          <div className="products-grid grid gap-6 grid-cols-1" dir="rtl">
            <SearchInput
              setSearchTerm={handleSearchChange}
              placeholder="ابحث بالـ ID، اللون، الفئة، نوع القطعة أو نوع التطريز..."
              initialValue={searchTerm}
              defaultValue={searchTerm}
              value={searchTerm}
            />

            {searchLoading && (
              <div className="wz-inlineLoader" role="status" aria-live="polite">
                <span className="wz-btnSpinner" aria-hidden="true" />
                <span>جاري البحث…</span>
              </div>
            )}
          </div>

          {/* Error */}
          {isError && (
            <div className="wz-products-error" dir="rtl">
              <span>حدث خطأ أثناء تحميل المنتجات.</span>
              <button type="button" className="wz-retryBtn" onClick={() => refetch()}>
                إعادة المحاولة
              </button>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8 mt-4">
            {/* Filters (right) */}
            <div className="w-full lg:w-[360px]">
              <SelectorPageProducts
                categorySel={categorySel}
                setCategorySel={setCategorySel}
                categories={categories}
                subCategorySel={subCategorySel}
                setSubCategorySel={setSubCategorySel}
                subCategories={SUBCATEGORY_OPTIONS.map((o) => o.value)}
                colorSel={colorSel}
                setColorSel={setColorSel}
                colors={colors}
                embroiderySel={embroiderySel}
                setEmbroiderySel={setEmbroiderySel}
                embroideryTypes={embroideryTypes}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                minPrice={minPrice}
                maxPrice={maxPrice}
                clearFilters={clearFilters}
              />
            </div>

            {/* List */}
            <div className="flex-1">
              <div
                className="products-list grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 place-items-stretch"
                style={{ justifyItems: "stretch" }}
              >
                {filtered.length ? (
                  filtered.map((product, index) => (
                    <FadeInSection
                      key={product?._id || index}
                      delay={index * 0.06}
                      duration={0.5}
                      yOffset={24}
                    >
                      <ProductCard product={product} />
                    </FadeInSection>
                  ))
                ) : (
                  <p className="col-span-full text-center text-gray-500">
                    لم يتم العثور على منتجات مطابقة لبحثك.
                  </p>
                )}
              </div>

              {/* Load more */}
              {matched.length > 0 && filtered.length < matched.length && !searchLoading && (
                <div className="wz-loadMoreWrap" dir="rtl">
                  <button
                    type="button"
                    className="wz-loadMoreBtn"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    aria-busy={isLoadingMore ? "true" : "false"}
                  >
                    <span className="wz-loadMoreInner">
                      {isLoadingMore && <span className="wz-btnSpinner" aria-hidden="true" />}
                      <span>
                        {isLoadingMore
                          ? "جاري تحميل المزيد…"
                          : `عرض المزيد (${Math.min(LOAD_STEP, matched.length - filtered.length)} منتجات)`}
                      </span>
                    </span>
                  </button>

                  <div className="wz-loadMoreHint">
                    تم عرض <strong>{filtered.length}</strong> من <strong>{matched.length}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FadeInSection>
  );
};

export default Products;