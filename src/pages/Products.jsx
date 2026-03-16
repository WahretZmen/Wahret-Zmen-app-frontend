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

/* ---------------------------
   Category helpers
--------------------------- */
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

/* ---------------------------
   Subcategory helpers
--------------------------- */
const SUBCATEGORY_OPTIONS = [
  { value: "All", label: "الكل" },
  { value: "accessories", label: "إكسسوارات" },
  { value: "costume", label: "بدلة" },
  { value: "vest", label: "صدريّة" },
  { value: "mens_abaya", label: "عباية رجالي" },
  { value: "jebba", label: "جبة" },
];

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

const canonicalSubCategory = (raw) => {
  const n = normalize(raw);
  return SUBCATEGORY_ALIAS_TO_KEY[n] || String(raw || "").trim() || "";
};

/* ---------------------------
   Product field helpers
--------------------------- */
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

  return canonicalSubCategory(pickText(raw));
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
   Premium dynamic copy
--------------------------- */
const CATEGORY_COPY = {
  All: {
    badge: "مجموعة وهرة زمان",
    title: "اكتشف تشكيلة راقية تجمع بين الأصالة والفخامة",
    description:
      "تأمل مجموعة وهرة زمان المختارة بعناية من الأزياء والقطع التقليدية الراقية، حيث يلتقي التراث التونسي بجمال التفاصيل الراقية لتمنحك إطلالة أنيقة، متوازنة، ومميزة في كل مناسبة.",
  },
  Men: {
    badge: "أناقة رجالية أصيلة",
    title: "قطع رجالية بهوية تقليدية وحضور فاخر",
    description:
      "تصفح تشكيلة الرجال المصممة لتجسّد الوقار، الرقي، والهوية التونسية الأصيلة، مع قصّات مدروسة وتفاصيل أنيقة تمنح كل إطلالة طابعًا فخمًا وواثقًا.",
  },
  Women: {
    badge: "أناقة نسائية فاخرة",
    title: "تصاميم نسائية راقية تعكس الجمال والتراث",
    description:
      "اكتشف مجموعة النساء التي تجمع بين نعومة الحضور وفخامة التفاصيل، مع لمسات مستوحاة من التراث التونسي لتمنحك إطلالة أنثوية راقية تناسب المناسبات الراقية واليومية.",
  },
  Children: {
    badge: "أناقة الأطفال",
    title: "قطع أطفال أنيقة بلمسة تقليدية ساحرة",
    description:
      "تشكيلة الأطفال في وهرة زمان صُممت لتجمع بين الراحة، الجمال، والهوية التقليدية، مع تصاميم أنيقة تمنح الصغار حضورًا مميزًا ومظهرًا مرتبًا في مختلف المناسبات.",
  },
};

const SUBCATEGORY_COPY = {
  All: {
    badge: "تشكيلة مختارة بعناية",
    title: "مجموعة متكاملة من القطع التقليدية الراقية",
    description:
      "استكشف تشكيلة متنوعة من القطع المختارة لتلائم مختلف الأذواق والمناسبات، مع توازن جميل بين الفخامة، الهوية، وجودة التفاصيل في كل منتج.",
  },
  accessories: {
    badge: "إكسسوارات فاخرة",
    title: "إكسسوارات راقية تكمل الإطلالة بأناقة",
    description:
      "مجموعة من الإكسسوارات المنتقاة بعناية لتضفي على الزي التقليدي لمسة نهائية أنيقة ومتناغمة، وتمنح الإطلالة عمقًا بصريًا وجاذبية أكثر رقيًا.",
  },
  costume: {
    badge: "بدلات أنيقة",
    title: "بدلات تقليدية بحضور رسمي ولمسة فخمة",
    description:
      "اكتشف بدلات تجمع بين الهيبة، التناسق، والأناقة الراقية، صُممت لتمنحك مظهرًا مرتبًا ومميزًا يليق بالمناسبات الخاصة والإطلالات الرفيعة.",
  },
  vest: {
    badge: "صدريّات راقية",
    title: "صدريّات تضيف عمقًا وأناقة إلى المظهر",
    description:
      "تشكيلة من الصدريّات التي تبرز جمال الزي التقليدي وتمنحه لمسة فاخرة ومتوازنة، مع تفاصيل أنيقة تضيف قيمة واضحة إلى الإطلالة الكاملة.",
  },
  mens_abaya: {
    badge: "عباية رجالي",
    title: "عبايات رجالية بطابع أصيل وحضور مميز",
    description:
      "قطع رجالية راقية تعكس الوقار والهوية التونسية في قالب أنيق وفخم، مع خطوط هادئة وتفاصيل تمنح المظهر تميّزًا بصريًا راقيًا.",
  },
  jebba: {
    badge: "جبب تونسية أصيلة",
    title: "جبب تجمع بين التراث والفخامة المعاصرة",
    description:
      "اكتشف تشكيلة الجبب التي تعبّر عن روح التراث التونسي بلمسة راقية، مع خامات جميلة وتفاصيل أنيقة تمنح كل قطعة حضورًا مميزًا وهوية واضحة.",
  },
};

const CATEGORY_LABEL_AR = {
  All: "كل الفئات",
  Men: "الرجال",
  Women: "النساء",
  Children: "الأطفال",
};

const SUBCATEGORY_LABEL_AR = {
  All: "كل القطع",
  accessories: "الإكسسوارات",
  costume: "البدلات",
  vest: "الصدريّات",
  mens_abaya: "العبايات الرجالية",
  jebba: "الجبب",
};

const getFilterIntro = ({ categoryKey, subCategoryKey, count }) => {
  const category = CATEGORY_COPY[categoryKey] || CATEGORY_COPY.All;
  const sub = SUBCATEGORY_COPY[subCategoryKey] || SUBCATEGORY_COPY.All;

  const isCatAll = categoryKey === "All";
  const isSubAll = subCategoryKey === "All";

  if (!isCatAll && !isSubAll) {
    const catLabel = CATEGORY_LABEL_AR[categoryKey] || "هذه الفئة";
    const subLabel = SUBCATEGORY_LABEL_AR[subCategoryKey] || "هذه القطعة";

    return {
      badge: `${category.badge} • ${sub.badge}`,
      title: `${subLabel} ضمن مجموعة ${catLabel}`,
      description: `استكشف أجمل خيارات ${subLabel} ضمن فئة ${catLabel} في وهرة زمان، حيث تلتقي جودة الاختيار بفخامة التفاصيل لتقديم منتجات تعبّر عن الذوق الرفيع والهوية التقليدية الأنيقة.`,
      countLabel:
        count === 0
          ? `لا توجد منتجات مطابقة حاليًا ضمن ${subLabel} في فئة ${catLabel}.`
          : count === 1
          ? `تم العثور على منتج واحد ضمن ${subLabel} في فئة ${catLabel}.`
          : `تم العثور على ${count} منتجات ضمن ${subLabel} في فئة ${catLabel}.`,
    };
  }

  if (!isCatAll) {
    return {
      badge: category.badge,
      title: category.title,
      description: category.description,
      countLabel:
        count === 0
          ? "لا توجد منتجات مطابقة حاليًا ضمن هذه الفئة."
          : count === 1
          ? "تم العثور على منتج واحد ضمن هذه الفئة."
          : `تم العثور على ${count} منتجات ضمن هذه الفئة.`,
    };
  }

  if (!isSubAll) {
    return {
      badge: sub.badge,
      title: sub.title,
      description: sub.description,
      countLabel:
        count === 0
          ? "لا توجد منتجات مطابقة حاليًا ضمن هذا النوع من القطع."
          : count === 1
          ? "تم العثور على منتج واحد ضمن هذا النوع من القطع."
          : `تم العثور على ${count} منتجات ضمن هذا النوع من القطع.`,
    };
  }

  return {
    badge: CATEGORY_COPY.All.badge,
    title: CATEGORY_COPY.All.title,
    description: CATEGORY_COPY.All.description,
    countLabel:
      count === 0
        ? "لا توجد منتجات مطابقة حاليًا."
        : count === 1
        ? "تم العثور على منتج واحد."
        : `تم العثور على ${count} منتجات في المجموعة الحالية.`,
  };
};

/* ---------------------------
   Component
--------------------------- */
const Products = () => {
  const LOAD_STEP = 9;
  const isRTL = true;

  const [categorySel, setCategorySel] = useState("All");
  const [subCategorySel, setSubCategorySel] = useState("All");
  const [colorSel, setColorSel] = useState("All");
  const [embroiderySel, setEmbroiderySel] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 1000]);

  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(LOAD_STEP);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const isSyncingFromURL = useRef(false);
  const searchDebounceRef = useRef(null);

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

  const shouldRefetch = useSelector((state) => state.productEvents.shouldRefetch);

  useEffect(() => {
    if (shouldRefetch) {
      refetch();
      dispatch(productEventsActions.resetRefetch());
    }
  }, [shouldRefetch, refetch, dispatch]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [location.pathname, location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const rawCat = params.get("category");
    const rawQ = params.get("search") || params.get("q") || "";
    const rawSub = params.get("sub") || params.get("subcategory") || "";

    isSyncingFromURL.current = true;

    setCategorySel(mapURLCategoryToUI(rawCat));
    setSearchTerm(rawQ);

    const canonicalSub = rawSub ? canonicalSubCategory(rawSub) : "All";
    const isAllowed =
      canonicalSub === "All" ||
      SUBCATEGORY_OPTIONS.some((o) => normalize(o.value) === normalize(canonicalSub));

    setSubCategorySel(isAllowed ? canonicalSub : "All");
    setVisibleCount(LOAD_STEP);

    const t = setTimeout(() => {
      isSyncingFromURL.current = false;
    }, 0);

    return () => clearTimeout(t);
  }, [location.search]);

  useEffect(() => {
    if (isSyncingFromURL.current) return;

    const params = new URLSearchParams(location.search);

    const urlCat = uiCategoryToUrl(categorySel);
    if (!urlCat) params.delete("category");
    else params.set("category", urlCat);

    if (!subCategorySel || subCategorySel === "All") {
      params.delete("sub");
      params.delete("subcategory");
    } else {
      params.set("sub", canonicalSubCategory(subCategorySel));
    }

    navigate({ search: params.toString() }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySel, subCategorySel]);

  const handleSearchChange = (term) => {
    setSearchLoading(true);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => {
      setSearchTerm(term);
      setSearchLoading(false);
      setVisibleCount(LOAD_STEP);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

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

  useEffect(() => {
    setPriceRange(([lo, hi]) => {
      const next = [
        Math.max(minPrice, lo ?? minPrice),
        Math.min(maxPrice, hi ?? maxPrice),
      ];
      return next[0] > next[1] ? [minPrice, maxPrice] : next;
    });
  }, [minPrice, maxPrice]);

  useEffect(() => {
    setVisibleCount(LOAD_STEP);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySel, subCategorySel, colorSel, embroiderySel, priceRange]);

  const matched = useMemo(() => {
    const q = normalize(searchTerm);
    const sel = canonicalCategory(categorySel) || "All";
    const subSel = canonicalSubCategory(subCategorySel || "All");
    const embroideryFilter = normalize(embroiderySel || "All");

    return products.filter((p) => {
      const catOfProduct = canonicalCategory(p?.category);
      const catOk = sel === "All" || catOfProduct === sel;

      const subOfProduct = getProductSubCategory(p);
      const subOk = subSel === "All" || !subSel ? true : subOfProduct === subSel;

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
      const searchPool = [
        pid,
        embroideryText,
        catOfProduct,
        subOfProduct,
        ...productColorNames(p),
      ]
        .filter(Boolean)
        .map((t) => normalize(t));

      const searchOk = !q || searchPool.some((t) => t.includes(q));

      return catOk && subOk && colorOk && priceOk && embroideryOk && searchOk;
    });
  }, [products, categorySel, subCategorySel, colorSel, priceRange, searchTerm, embroiderySel]);

  const filtered = useMemo(() => matched.slice(0, visibleCount), [matched, visibleCount]);

  const filterIntro = useMemo(() => {
    const categoryKey = canonicalCategory(categorySel || "All") || "All";
    const subCategoryKey = canonicalSubCategory(subCategorySel || "All") || "All";

    return getFilterIntro({
      categoryKey,
      subCategoryKey,
      count: matched.length,
    });
  }, [categorySel, subCategorySel, matched.length]);

  const handleLoadMore = () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    setTimeout(() => {
      setVisibleCount((prev) => prev + LOAD_STEP);
      setIsLoadingMore(false);
    }, 650);
  };

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
      <div className="main-content wz-productsPage">
        <div className="wz-productsShell">
          <Helmet>
            <title>المنتجات - Wahret Zmen</title>
          </Helmet>

          <div className="wz-productsSearchArea" dir="rtl">
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

          {isError && (
            <div className="wz-products-error" dir="rtl">
              <span>حدث خطأ أثناء تحميل المنتجات.</span>
              <button type="button" className="wz-retryBtn" onClick={() => refetch()}>
                إعادة المحاولة
              </button>
            </div>
          )}

          <div className="wz-productsLayout">
            <aside className="wz-productsSidebar" dir="rtl">
              <div className="wz-productsSidebarInner">
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
            </aside>

            <section className="wz-productsMain" dir="rtl">
              <div className="wz-filterIntro">
                <div className="wz-filterIntroBadge">{filterIntro.badge}</div>

                <h2 className={`wz-filterIntroTitle sparkle ${isRTL ? "rtl" : "ltr"}`}>
                  <span className="wz-filterIntroTitle__text">{filterIntro.title}</span>
                  <span className="wz-filterIntroTitle__underline" />
                </h2>

                <p className="wz-filterIntroDesc">{filterIntro.description}</p>

                <div className="wz-filterIntroMeta">
                  <span className="wz-filterIntroCount">{filterIntro.countLabel}</span>

                  {(canonicalSubCategory(subCategorySel || "All") !== "All" ||
                    canonicalCategory(categorySel || "All") !== "All" ||
                    normalize(searchTerm) ||
                    normalize(colorSel) !== "all" ||
                    normalize(embroiderySel) !== "all") && (
                    <button
                      type="button"
                      className="wz-filterIntroReset"
                      onClick={clearFilters}
                    >
                      عرض جميع المنتجات
                    </button>
                  )}
                </div>
              </div>

              <div className="products-list wz-productsGrid3">
                {filtered.length ? (
                  filtered.map((product, index) => (
                    <FadeInSection
                      key={product?._id || index}
                      delay={index * 0.05}
                      duration={0.45}
                      yOffset={20}
                    >
                      <ProductCard product={product} />
                    </FadeInSection>
                  ))
                ) : (
                  <div className="wz-emptyState">
                    <h3 className="wz-emptyStateTitle">لا توجد نتائج مطابقة</h3>
                    <p className="wz-emptyStateText">
                      لم يتم العثور على منتجات مطابقة للفلاتر الحالية. جرّب تعديل
                      الفئة أو نوع القطعة أو نطاق السعر للحصول على نتائج أقرب لما تبحث عنه.
                    </p>
                    <button
                      type="button"
                      className="wz-emptyStateBtn"
                      onClick={clearFilters}
                    >
                      مسح الفلاتر وعرض الكل
                    </button>
                  </div>
                )}
              </div>

              {matched.length > 0 && filtered.length < matched.length && !searchLoading && (
                <div className="wz-loadMoreWrap">
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
                          : `عرض المزيد (${Math.min(
                              LOAD_STEP,
                              matched.length - filtered.length
                            )} منتجات)`}
                      </span>
                    </span>
                  </button>

                  <div className="wz-loadMoreHint">
                    تم عرض <strong>{filtered.length}</strong> من <strong>{matched.length}</strong>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </FadeInSection>
  );
};

export default Products;