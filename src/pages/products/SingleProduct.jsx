// src/pages/products/SingleProduct.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiLink,
  FiPhoneCall,
  FiArrowUpRight,
} from "react-icons/fi";
import {
  Star,
  Banknote,
  Truck,
  ShieldCheck,
  MapPin,
  User,
  Phone,
  Mail,
  Package,
  Image as ImageIcon,
  X,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";

import {
  useGetProductByIdQuery,
  useGetAllProductsQuery,
} from "../../redux/features/products/productsApi.js";
import productsApi from "../../redux/features/products/productsApi.js";
import { addToCart, clearCart } from "../../redux/features/cart/cartSlice.js";
import { useCreateOrderMutation } from "../../redux/features/orders/ordersApi.js";

import { getImgUrl } from "../../utils/getImgUrl.js";
import SearchInput from "../../components/SearchInput.jsx";
import FadeInSection from "../../Animations/FadeInSection.jsx";

import "../../Styles/StylesSingleProduct.css";
import "../../Styles/StylesCheckoutPage.css";

/* =============================================================================
   Small helpers
============================================================================= */
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const safeStr = (v) => (typeof v === "string" ? v : String(v ?? ""));
const unique = (arr) => [...new Set((arr || []).filter(Boolean))];
const normalizeKey = (v) => String(v || "").trim().toLowerCase();

const VENDOR_PHONE = "+216 55 495 816";
const VENDOR_PHONE_RAW = "+21655495816";

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

const getColorIdentity = (color) => {
  if (!color) return "";
  const byId = safeStr(color?._id);
  if (byId) return `id:${byId}`;

  const byImage = safeStr(color?.image || color?.images?.[0]);
  if (byImage) return `img:${byImage}`;

  const byName =
    safeStr(color?.colorName?.ar) ||
    safeStr(color?.colorName?.fr) ||
    safeStr(color?.colorName?.en) ||
    pickText(color?.colorName);

  return `name:${byName}`;
};

const findFreshSelectedColor = (product, selectedColor) => {
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  if (!colors.length) return selectedColor ? normalizeColor(selectedColor) : null;

  if (!selectedColor) return normalizeColor(colors[0]);

  const wantedIdentity = getColorIdentity(selectedColor);

  const matched = colors.find((c) => {
    const normalized = normalizeColor(c);
    return getColorIdentity(normalized) === wantedIdentity;
  });

  return normalizeColor(matched || colors[0]);
};

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

const pickColorLabel = (color) => {
  if (!color) return "اللون الأصلي";
  return (
    color?.colorName?.ar ||
    color?.colorName?.fr ||
    color?.colorName?.en ||
    pickText(color?.colorName) ||
    "اللون الأصلي"
  );
};

const getUnitPrice = (product) => {
  const newP = product?.newPrice;
  const oldP = product?.oldPrice;

  if (newP !== null && newP !== undefined && Number.isFinite(Number(newP))) {
    return Math.max(0, Number(newP));
  }
  if (oldP !== null && oldP !== undefined && Number.isFinite(Number(oldP))) {
    return Math.max(0, Number(oldP));
  }
  return 0;
};

const getCartItemProductId = (it) =>
  safeStr(
    it?.productId ||
      it?.id ||
      it?._id ||
      it?.product?.productId ||
      it?.product?.id ||
      it?.product?._id
  );

const pickItemImage = (it) => {
  const images = Array.isArray(it?.color?.images) ? it.color.images.filter(Boolean) : [];
  return it?.color?.image || images[0] || it?.coverImage || "";
};

const getStockBadgeMeta = (stock) => {
  const qty = Math.max(0, Number(stock || 0));

  if (qty <= 0) {
    return {
      label: "نفد المخزون",
      sub: "غير متوفر الآن",
      className: "is-out",
    };
  }

  if (qty <= 3) {
    return {
      label: `آخر ${qty} قطع`,
      sub: "كمية محدودة",
      className: "is-low",
    };
  }

  if (qty <= 10) {
    return {
      label: `${qty} متوفر`,
      sub: "جاهز للطلب",
      className: "is-mid",
    };
  }

  return {
    label: `${qty} متوفر`,
    sub: "متوفر الآن",
    className: "is-good",
  };
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
  ownerLabel: "بإدارة صبري بن سعد",
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
   Minimal modal reused from Checkout page
============================================================================= */
const TermsModal = ({ open, onClose, title, children, isRTL = true }) => {
  const dialogRef = useRef(null);
  const [visible, setVisible] = useState(open);
  const titleId = React.useId();

  useEffect(() => {
    if (open) setVisible(true);
    else {
      const t = setTimeout(() => setVisible(false), 260);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open && dialogRef.current) dialogRef.current.focus();
  }, [open]);

  if (!visible) return null;

  return (
    <div
      className="wz-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`wz-modal ${open ? "" : "wz-modal--closing"}`}
      >
        <div className="wz-modal-header">
          <h3 id={titleId} className="wz-modal-title">
            {title}
          </h3>
          <button
            type="button"
            className="wz-modal-close"
            aria-label="إغلاق"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="wz-modal-body">{children}</div>

        <div className="wz-modal-footer">
          <button type="button" className="wz-btn" onClick={onClose}>
            حسنًا
          </button>
        </div>
      </div>
    </div>
  );
};

/* =============================================================================
   Component
============================================================================= */
const SingleProduct = () => {
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const routeId = params?.productId || params?.id || "";
  const isRTL = true;

  const checkoutSectionRef = useRef(null);
  const pendingScrollToCheckoutRef = useRef(false);
  const checkoutScrollRetryRef = useRef(0);
  const checkoutScrollFrameRef = useRef(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState([]);

  const {
    data: queriedProduct,
    isLoading: isLoadingProduct,
    isError: isQueryError,
  } = useGetProductByIdQuery(routeId, { skip: !routeId });

  const { data: allProducts = [], isLoading: isLoadingAll } =
    useGetAllProductsQuery();
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();

  const product = useMemo(() => {
    if (queriedProduct && typeof queriedProduct === "object") return queriedProduct;
    return resolveProductFromList(allProducts, routeId);
  }, [queriedProduct, allProducts, routeId]);

  const isLoading = !product && (isLoadingProduct || isLoadingAll);
  const isError = !product && !isLoading && isQueryError;

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  const THUMBS_PER_VIEW = 6;
  const [thumbStart, setThumbStart] = useState(0);
  const [activeTab, setActiveTab] = useState("desc");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal: "",
  });
  const [errors, setErrors] = useState({});
  const [agree, setAgree] = useState(false);
  const [openWhich, setOpenWhich] = useState(null);

  const translatedTitle = pickTitle(product);
  const translatedDescription =
    product?.translations?.ar?.description ||
    product?.description ||
    product?.translations?.fr?.description ||
    product?.translations?.en?.description ||
    "لا يوجد وصف متاح لهذا المنتج.";

  const productDisplayId = useMemo(() => displayId(product), [product]);

  const categoryAr = mapCategoryToArabic(product?.category);
  const categoryKey = normalizeCategoryKey(product?.category);
  const categoryEn = EN_CATEGORY_MAP[categoryKey] || "Products";

  const embroideryText = pickEmbroideryText(product);
  const embroideryKey = getEmbroideryKey(product);

  const subCategoryText = pickSubCategoryText(product);
  const subCategoryKey = getSubCategoryKey(product);

  const sizes = useMemo(
    () =>
      Array.isArray(product?.sizes)
        ? product.sizes.map((s) => String(s).trim()).filter(Boolean)
        : [],
    [product]
  );

  const isTrending = Boolean(
    product?.trending ||
      product?.isTrending ||
      product?.tags?.includes?.("trending") ||
      product?.labels?.includes?.("trending")
  );

  const unitPrice = useMemo(() => getUnitPrice(product), [product]);

  const subtotal = useMemo(
    () =>
      checkoutItems.reduce(
        (acc, item) =>
          acc + Number(item?.newPrice || item?.price || item?.unitPrice || 0) * Number(item?.quantity || 0),
        0
      ),
    [checkoutItems]
  );

  const shipping = 0;
  const total = subtotal + shipping;

  const breadcrumbCurrentLabel = useMemo(() => {
    const pieces = ["منتج", categoryEn];
    if (subCategoryText) pieces.push(subCategoryText);
    if (embroideryText) pieces.push(embroideryText);
    return pieces.join(" - ");
  }, [categoryEn, subCategoryText, embroideryText]);

  const liveSelectedColor = useMemo(() => {
    return findFreshSelectedColor(product, selectedColor);
  }, [product, selectedColor]);

  const activeGallery = useMemo(() => {
    return getProductGallery(product, liveSelectedColor);
  }, [product, liveSelectedColor]);

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

    setSelectedColor(firstColor ? normalizeColor(firstColor) : null);
    setSelectedImageIndex(0);
    setThumbStart(0);
    setActiveTab("desc");
    setSelectedSize(
      Array.isArray(product?.sizes) && product.sizes.length ? product.sizes[0] : ""
    );
    setQuantity(1);
    setErrors({});
    setAgree(false);
    setShowCheckout(false);
    setCheckoutItems([]);
    pendingScrollToCheckoutRef.current = false;

    if (checkoutScrollRetryRef.current) {
      window.clearTimeout(checkoutScrollRetryRef.current);
      checkoutScrollRetryRef.current = 0;
    }

    if (checkoutScrollFrameRef.current) {
      window.cancelAnimationFrame(checkoutScrollFrameRef.current);
      checkoutScrollFrameRef.current = 0;
    }
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

  const ratingValue = Math.max(
    0,
    Math.min(5, Math.round(Number(product?.rating ?? 0)))
  );

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
  }, [routeId]);

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

  const copyLink = async () => {
    const text = shareUrl || "";
    if (!text) return false;

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        window.prompt("انسخ رابط المنتج يدويًا:", text);
      } catch {}
      return false;
    }
  };

  const openShare = async (url) => {
    await copyLink();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const setZoomVars = useCallback((e) => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) return;
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

  const selectedColorStock = useMemo(() => {
    if (liveSelectedColor && Number.isFinite(Number(liveSelectedColor.stock))) {
      return Math.max(0, Number(liveSelectedColor.stock));
    }

    const colors = Array.isArray(product?.colors) ? product.colors : [];
    if (colors.length) {
      const total = colors.reduce((sum, c) => sum + Math.max(0, num(c?.stock, 0)), 0);
      return Math.max(0, total);
    }

    return Math.max(0, num(product?.stockQuantity || product?.stock, 0));
  }, [liveSelectedColor, product]);

  const stockBadge = useMemo(
    () => getStockBadgeMeta(selectedColorStock),
    [selectedColorStock]
  );

  useEffect(() => {
    setQuantity((prev) => {
      const safePrev = Math.max(1, Number(prev || 1));

      if (selectedColorStock <= 0) return 1;
      if (safePrev > selectedColorStock) return selectedColorStock;

      return safePrev;
    });
  }, [selectedColorStock]);

  const canIncreaseQty = selectedColorStock > 0 && quantity < selectedColorStock;
  const canDecreaseQty = quantity > 1;

  const handleIncreaseQty = () => {
    setQuantity((prev) => {
      if (selectedColorStock > 0) return Math.min(prev + 1, selectedColorStock);
      return prev + 1;
    });
  };

  const handleDecreaseQty = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleInternalProductNavigation = () => {};

  const validateSelectionBeforeAction = () => {
    if (sizes.length > 0 && !selectedSize) {
      window.alert("الرجاء اختيار المقاس المناسب قبل المتابعة.");
      return false;
    }

    if (selectedColorStock === 0) {
      window.alert("هذا اللون غير متوفر في المخزون الآن.");
      return false;
    }

    return true;
  };

  const buildCartPayload = () => {
    const safeQty =
      selectedColorStock > 0
        ? Math.max(1, Math.min(quantity, selectedColorStock))
        : Math.max(1, quantity);

    const baseColor = liveSelectedColor
      ? {
          ...liveSelectedColor,
          colorName: liveSelectedColor.colorName || {
            ar: pickColorLabel(liveSelectedColor),
            fr: pickColorLabel(liveSelectedColor),
            en: pickColorLabel(liveSelectedColor),
          },
          image:
            liveSelectedColor.image ||
            liveSelectedColor.images?.[0] ||
            activeGallery[0] ||
            product?.coverImage ||
            "",
          images:
            Array.isArray(liveSelectedColor.images) && liveSelectedColor.images.length
              ? liveSelectedColor.images
              : liveSelectedColor.image
              ? [liveSelectedColor.image]
              : activeGallery[0]
              ? [activeGallery[0]]
              : product?.coverImage
              ? [product.coverImage]
              : [],
          stock: Math.max(0, num(liveSelectedColor.stock, 0)),
        }
      : {
          colorName: { ar: "افتراضي", fr: "Default", en: "Default" },
          image: activeGallery[0] || product?.coverImage || "",
          images:
            activeGallery[0] || product?.coverImage
              ? [activeGallery[0] || product?.coverImage]
              : [],
          stock: Math.max(0, num(product?.stockQuantity || product?.stock, 0)),
        };

    return {
      ...product,
      productId: displayId(product),
      id: displayId(product),
      title: translatedTitle,
      coverImage: product?.coverImage || baseColor.image || "",
      newPrice: unitPrice,
      oldPrice: product?.oldPrice ?? null,
      price: unitPrice,
      unitPrice,
      quantity: safeQty,
      size: selectedSize || "",
      selectedSize: selectedSize || "",
      color: baseColor,
      colorKey:
        baseColor?.image ||
        baseColor?.images?.[0] ||
        JSON.stringify(baseColor?.colorName || {}),
      embroideryCategory: product?.embroideryCategory || "",
      translations: product?.translations || {},
      stockQuantity: num(product?.stockQuantity, 0),
    };
  };

  const performCheckoutScroll = useCallback(() => {
    if (typeof window === "undefined") return false;

    const el = checkoutSectionRef.current;
    if (!el) return false;

    el.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });

    const offset = window.innerWidth <= 640 ? 14 : 22;

    const applyOffset = () => {
      const rect = el.getBoundingClientRect();
      const absoluteTop = window.pageYOffset + rect.top;
      window.scrollTo({
        top: Math.max(0, absoluteTop - offset),
        behavior: "smooth",
      });
    };

    window.setTimeout(applyOffset, 80);
    window.setTimeout(applyOffset, 220);
    window.setTimeout(applyOffset, 420);

    return true;
  }, []);

  const queueReliableCheckoutScroll = useCallback(() => {
    if (typeof window === "undefined") return;

    if (checkoutScrollRetryRef.current) {
      window.clearTimeout(checkoutScrollRetryRef.current);
      checkoutScrollRetryRef.current = 0;
    }

    let tries = 0;
    const maxTries = 30;

    const tryScroll = () => {
      tries += 1;

      const ok = performCheckoutScroll();
      if (ok) {
        pendingScrollToCheckoutRef.current = false;
        checkoutScrollRetryRef.current = 0;
        return;
      }

      if (tries < maxTries) {
        checkoutScrollRetryRef.current = window.setTimeout(tryScroll, 120);
      } else {
        pendingScrollToCheckoutRef.current = false;
        checkoutScrollRetryRef.current = 0;
      }
    };

    checkoutScrollFrameRef.current = window.requestAnimationFrame(() => {
      checkoutScrollFrameRef.current = window.requestAnimationFrame(() => {
        tryScroll();
      });
    });
  }, [performCheckoutScroll]);

  const handleAddToCartAndCheckout = () => {
    if (!validateSelectionBeforeAction()) return;

    const payload = buildCartPayload();

    setCheckoutItems([payload]);
    dispatch(addToCart(payload));

    pendingScrollToCheckoutRef.current = true;
    setShowCheckout(true);
  };

  useLayoutEffect(() => {
    if (!showCheckout) return;
    if (!pendingScrollToCheckoutRef.current) return;

    queueReliableCheckoutScroll();
  }, [showCheckout, queueReliableCheckoutScroll]);

  useEffect(() => {
    if (!showCheckout) return;
    if (!pendingScrollToCheckoutRef.current) return;

    const t1 = window.setTimeout(() => {
      queueReliableCheckoutScroll();
    }, 180);

    const t2 = window.setTimeout(() => {
      queueReliableCheckoutScroll();
    }, 420);

    const t3 = window.setTimeout(() => {
      queueReliableCheckoutScroll();
    }, 700);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [showCheckout, queueReliableCheckoutScroll]);

  useEffect(() => {
    return () => {
      if (checkoutScrollRetryRef.current) {
        window.clearTimeout(checkoutScrollRetryRef.current);
      }
      if (checkoutScrollFrameRef.current) {
        window.cancelAnimationFrame(checkoutScrollFrameRef.current);
      }
    };
  }, []);

  const handleBackToTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const validateCheckout = () => {
    const required = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "postal",
    ];

    const next = {};
    required.forEach((f) => {
      if (!safeStr(formData[f]).trim()) next[f] = true;
    });

    if (!checkoutItems.length) {
      return { msg: "لا توجد منتجات داخل السلة لإتمام الطلب.", fields: next };
    }

    if (!agree) {
      return {
        msg: "يرجى الموافقة على الشروط والأحكام وسياسة الخصوصية قبل تأكيد الطلب.",
        fields: next,
      };
    }

    if (Object.keys(next).length) {
      return { msg: "الرجاء إدخال كل المعلومات المطلوبة.", fields: next };
    }

    return { msg: "", fields: {} };
  };

  const checkoutSummaryItems = useMemo(() => {
    return checkoutItems.map((it, index) => {
      const pid = getCartItemProductId(it);
      const title =
        it?.translations?.ar?.title ||
        it?.translations?.fr?.title ||
        it?.translations?.en?.title ||
        it?.title ||
        "منتج";

      const colorLabel =
        it?.color?.colorName?.ar ||
        it?.color?.colorName?.fr ||
        it?.color?.colorName?.en ||
        (typeof it?.color?.colorName === "string" ? it.color.colorName : "") ||
        "أصلي";

      return {
        key: `${pid}-${safeStr(it?.colorKey || index)}`,
        productId: pid,
        title,
        quantity: Number(it?.quantity || 1),
        size: safeStr(it?.size || it?.selectedSize || ""),
        colorLabel,
        image: pickItemImage(it),
      };
    });
  }, [checkoutItems]);

  const buildPayload = () => {
    const fullName = `${safeStr(formData.firstName).trim()} ${safeStr(
      formData.lastName
    ).trim()}`.trim();

    return {
      name: fullName,
      email: safeStr(formData.email).trim(),
      phone: safeStr(formData.phone).trim(),
      address: {
        street: safeStr(formData.address).trim(),
        city: safeStr(formData.city).trim(),
        state: safeStr(formData.state).trim(),
        country: "Tunisia",
        zipcode: safeStr(formData.postal).trim(),
      },
      products: checkoutItems.map((it) => {
        const productId = getCartItemProductId(it);
        const images = Array.isArray(it?.color?.images)
          ? it.color.images.filter(Boolean)
          : [];
        const mainImg = it?.color?.image || images[0] || it?.coverImage || "";
        const colorName =
          it?.color?.colorName?.ar ||
          it?.color?.colorName?.fr ||
          it?.color?.colorName?.en ||
          (typeof it?.color?.colorName === "string" ? it.color.colorName : "") ||
          "Default";

        return {
          productId,
          quantity: Math.max(1, Number(it?.quantity || 1)),
          color: {
            colorName,
            image: mainImg,
            images: images.length ? images : mainImg ? [mainImg] : [],
          },
          colorKey: safeStr(it?.colorKey || ""),
          size: safeStr(it?.size || it?.selectedSize || ""),
        };
      }),
      paymentMethod: "cod",
      totals: {
        subtotal: Number(subtotal.toFixed(2)),
        shipping: 0,
        total: Number(total.toFixed(2)),
      },
      consent: { agreed: true, at: new Date().toISOString() },
    };
  };

  const submitSingleOrder = async (e) => {
    e.preventDefault();

    const v = validateCheckout();
    if (v.msg) {
      setErrors(v.fields || {});
      window.alert(v.msg);
      return;
    }

    try {
      const payload = buildPayload();

      const hasInvalidProduct = payload.products.some((p) => !safeStr(p.productId));
      if (hasInvalidProduct) {
        throw new Error("يوجد منتج بدون معرّف productId صالح.");
      }

      const res = await createOrder(payload).unwrap();

      const order = res?.order || res?.data?.order || res || null;
      const orderId = order?.orderId || order?._id || res?.orderId || res?._id || "";

      if (!orderId) {
        throw new Error("لم يتم استلام مرجع الطلب من السيرفر.");
      }

      try {
        sessionStorage.setItem(
          "wz_last_order",
          JSON.stringify({ orderId: String(orderId), order, savedAt: Date.now() })
        );
      } catch {}

      dispatch(
        productsApi.util.invalidateTags([{ type: "Products", id: "LIST" }])
      );
      dispatch(clearCart());

      setCheckoutItems([]);

      navigate(`/order-success/${encodeURIComponent(orderId)}`, {
        state: { order },
      });
    } catch (err) {
      window.alert(err?.data?.message || err?.message || "حدث خطأ غير متوقع.");
    }
  };

  if (isLoading) {
    return (
      <div
        className="sp2-wrap"
        dir={isRTL ? "rtl" : "ltr"}
        lang="ar"
        style={{ minHeight: "calc(100vh - 140px)" }}
      >
        <div className="sp2-container">
          <div className="text-center text-[#111]">جارٍ التحميل...</div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div
        className="sp2-wrap"
        dir={isRTL ? "rtl" : "ltr"}
        lang="ar"
        style={{ minHeight: "calc(100vh - 140px)" }}
      >
        <div className="sp2-container">
          <div className="text-center text-red-600">المنتج غير موجود</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sp2-wrap" dir={isRTL ? "rtl" : "ltr"} lang="ar">
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
                      const rating = Math.max(
                        0,
                        Math.min(5, Math.round(Number(p?.rating ?? 0)))
                      );
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

            {productDisplayId ? (
              <span className="sp2-crumbId" dir="ltr" title={productDisplayId}>
                #{productDisplayId}
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

                  <div
                    className={`sp2-stockBadge ${stockBadge.className}`}
                    aria-label={`حالة المخزون: ${stockBadge.label}`}
                  >
                    <span className="sp2-stockBadgeDot" aria-hidden="true" />
                    <div className="sp2-stockBadgeText">
                      <strong>{stockBadge.label}</strong>
                      <span>{stockBadge.sub}</span>
                    </div>
                  </div>

                  <span className="sp2-imageGlow" aria-hidden="true" />

                  <img
                    src={getImgUrl(
                      activeGallery[selectedImageIndex] ||
                        liveSelectedColor?.image ||
                        liveSelectedColor?.images?.[0] ||
                        product?.coverImage
                    )}
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
                  #{productDisplayId}
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
                  href={`tel:${VENDOR_PHONE_RAW}`}
                  aria-label={`اتصل بالبائع ${VENDOR_PHONE}`}
                  title="اتصل بالبائع"
                >
                  <FiPhoneCall />
                  <span>اتصل بالبائع</span>
                  <strong dir="ltr">{VENDOR_PHONE}</strong>
                </a>
              </div>

              <div className="sp2-orderGuide">
                <div className="sp2-orderGuideBadge">مهم جدًا قبل الطلب</div>
                <p className="sp2-orderGuideText">
                  يُرجى الاتصال بالبائع أولًا على الرقم
                  <strong dir="ltr"> {VENDOR_PHONE} </strong>
                  لمعرفة السعر النهائي، ثم واصل إتمام الطلب لهذا المنتج{" "}
                  <span>باستعمال</span>{" "}
                  <strong dir="ltr">رقم المنتج # {productDisplayId}</strong>.
                </p>
              </div>

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
                    onClick={copyLink}
                    aria-label="مشاركة على إنستغرام (نسخ الرابط)"
                    title="Instagram (Copy Link)"
                  >
                    <FiInstagram />
                    <span>Instagram</span>
                  </button>

                  <button
                    type="button"
                    className="sp2-shareBtn is-link"
                    onClick={copyLink}
                    aria-label="نسخ رابط المنتج"
                    title="Copy Link"
                  >
                    <FiLink />
                    <span>نسخ الرابط</span>
                  </button>
                </div>
              </div>

              <div className="sp2-purchaseBox">
                <div className="sp2-purchaseHead">
                  <div>
                    <h3 className="sp2-purchaseTitle">إعداد الطلب</h3>
                    <p className="sp2-purchaseSub">
                      اختر المقاس والكمية، ثم اضغط على زر الإضافة للعربة ليظهر لك نموذج الطلب مباشرةً.
                    </p>
                  </div>
                  <div className="sp2-purchaseMeta">
                    <span className="sp2-purchaseMetaLabel">اللون المحدد</span>
                    <strong>{pickColorLabel(liveSelectedColor)}</strong>
                  </div>
                </div>

                <div className="sp2-orderFlowNotice">
                  <div className="sp2-orderFlowNoticeTop">
                    <span className="sp2-orderFlowChip">طريقة الطلب</span>
                    <span className="sp2-orderFlowId" dir="ltr">
                      Product ID: #{productDisplayId}
                    </span>
                  </div>

                  <ol className="sp2-orderFlowList">
                    <li>
                      اتصل بالبائع على
                      <strong dir="ltr"> {VENDOR_PHONE}</strong>
                    </li>
                    <li>اعرف السعر النهائي للمنتج</li>
                    <li>
                      ثم أكمل الطلب باستخدام{" "}
                      <strong dir="ltr">رقم المنتج # {productDisplayId}</strong>
                    </li>
                  </ol>
                </div>

                {Array.isArray(product?.colors) && product.colors.length > 1 && (
                  <div className="sp2-optionGroup">
                    <div className="sp2-optionLabel">الألوان المتوفرة</div>
                    <div className="sp2-colorsGrid">
                      {product.colors.map((c, idx) => {
                        const color = normalizeColor(c);
                        const isActive =
                          (liveSelectedColor?._id &&
                            color?._id &&
                            liveSelectedColor._id === color._id) ||
                          (liveSelectedColor?.image &&
                            color?.image &&
                            liveSelectedColor.image === color.image);

                        return (
                          <button
                            key={color?._id || color?.image || idx}
                            type="button"
                            className={`sp2-colorCard ${isActive ? "is-active" : ""}`}
                            onClick={() => {
                              const freshColor = normalizeColor(color);
                              setSelectedColor(freshColor);
                              setSelectedImageIndex(0);
                              setQuantity(1);
                            }}
                          >
                            <span className="sp2-colorThumbWrap">
                              <img
                                src={getImgUrl(color?.image || product?.coverImage)}
                                alt={pickColorLabel(color)}
                                className="sp2-colorThumb"
                              />
                            </span>
                            <span className="sp2-colorCardInfo">
                              <span className="sp2-colorName">{pickColorLabel(color)}</span>
                              <span className="sp2-colorStock">
                                {num(color?.stock, 0) > 0
                                  ? `المخزون: ${num(color?.stock, 0)}`
                                  : "غير متوفر"}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sizes.length > 0 && (
                  <div className="sp2-optionGroup">
                    <div className="sp2-optionLabel">المقاسات المتوفرة</div>
                    <div className="sp2-sizesGrid">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={`sp2-sizeBox ${selectedSize === size ? "is-active" : ""}`}
                          onClick={() => setSelectedSize(size)}
                          aria-pressed={selectedSize === size}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <div className="sp2-selectedHint">
                      المقاس المختار:
                      <strong>{selectedSize ? ` ${selectedSize}` : " لم يتم الاختيار بعد"}</strong>
                    </div>
                  </div>
                )}

                <div className="sp2-optionGroup">
                  <div className="sp2-optionLabel">الكمية</div>
                  <div className="sp2-qtyRow">
                    <button
                      type="button"
                      className="sp2-qtyBtn"
                      onClick={handleDecreaseQty}
                      disabled={!canDecreaseQty}
                      aria-label="إنقاص الكمية"
                    >
                      <Minus />
                    </button>

                    <div className="sp2-qtyValue">{quantity}</div>

                    <button
                      type="button"
                      className="sp2-qtyBtn"
                      onClick={handleIncreaseQty}
                      disabled={!canIncreaseQty}
                      aria-label="زيادة الكمية"
                    >
                      <Plus />
                    </button>
                  </div>

                  <div className="sp2-stockHint">
                    {selectedColorStock > 0
                      ? `المتوفر حاليًا: ${selectedColorStock}`
                      : "هذا الاختيار غير متوفر في المخزون"}
                  </div>
                </div>

                <div className="sp2-actionsGrid">
                  <button
                    type="button"
                    className="sp2-mainAction sp2-mainAction--dark"
                    onClick={handleAddToCartAndCheckout}
                  >
                    <ShoppingBag className="sp2-mainActionIcon" />
                    أضف إلى العربة
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
                      <strong dir="ltr">#{productDisplayId}</strong>
                    </div>
                  </div>

                  <div className="sp2-detailsTitle">المواصفات التقنية</div>

                  {subCategoryText ? (
                    <div className="sp2-detailRowPro">
                      <div className="sp2-detailKey">نوع القطعة</div>
                      <div className="sp2-detailVal">{subCategoryText}</div>
                    </div>
                  ) : null}

                  {sizes.length > 0 ? (
                    <div className="sp2-detailRowPro">
                      <div className="sp2-detailKey">المقاسات المتوفرة</div>
                      <div className="sp2-detailVal">{sizes.join(" - ")}</div>
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

        {showCheckout && (
          <FadeInSection delay={0.03} yOffset={20}>
            <div className="sp2-checkoutMount">
              <section
                id="sp2-inline-checkout"
                ref={checkoutSectionRef}
                className="sp2-inlineCheckout sp2-reveal sp2-reveal--section"
                aria-label="إتمام الطلب من صفحة المنتج"
              >
                <div className="sp2-inlineCheckoutHead">
                  <span className="sp2-likeEyebrow">Premium Checkout</span>
                  <h2 className="sp2-likeTitle">إتمام الطلب مباشرة من هذه الصفحة</h2>
                  <p className="sp2-likeIntro">
                    أكمل الآن معلوماتك ليتم تأكيد الطلب بسرعة وبأناقة.
                  </p>

                  <div className="sp2-checkoutImportantBox">
                    <div className="sp2-checkoutImportantTop">
                      <span className="sp2-checkoutImportantBadge">تنبيه مهم</span>
                    </div>
                    <p className="sp2-checkoutImportantText">
                      قبل تأكيد الطلب، اتصل بالبائع على
                      <strong dir="ltr"> {VENDOR_PHONE} </strong>
                      لمعرفة السعر النهائي، ثم واصل الطلب باستعمال{" "}
                      <strong>مراجع المنتجات الموجودة في السلة</strong>.
                    </p>
                  </div>
                </div>

                <div className="cz-grid sp2-inlineCheckoutGrid">
                  <div className="cz-left">
                    <form id="sp2-checkout-form" className="cz-formWrap" onSubmit={submitSingleOrder}>
                      <section className="cz-card animate-fade-in-delay-100">
                        <header className="cz-card__header">
                          <h2 className="cz-card__title">
                            <span className="cz-bubble" aria-hidden="true">
                              <User className="cz-bubble__icon" />
                            </span>
                            معلومات الاتصال
                          </h2>
                        </header>

                        <div className="cz-card__content cz-space-4">
                          <div className="cz-row2">
                            <div className="cz-field">
                              <label className="cz-label" htmlFor="sp2-firstName">
                                الاسم <span className="cz-required">*</span>
                              </label>
                              <input
                                id="sp2-firstName"
                                className={`cz-input ${errors.firstName ? "cz-input--error" : ""}`}
                                placeholder="أحمد"
                                value={formData.firstName}
                                onChange={(e) => handleChange("firstName", e.target.value)}
                                autoComplete="given-name"
                              />
                            </div>

                            <div className="cz-field">
                              <label className="cz-label" htmlFor="sp2-lastName">
                                اللقب <span className="cz-required">*</span>
                              </label>
                              <input
                                id="sp2-lastName"
                                className={`cz-input ${errors.lastName ? "cz-input--error" : ""}`}
                                placeholder="بن علي"
                                value={formData.lastName}
                                onChange={(e) => handleChange("lastName", e.target.value)}
                                autoComplete="family-name"
                              />
                            </div>
                          </div>

                          <div className="cz-row2">
                            <div className="cz-field">
                              <label className="cz-label cz-label--icon" htmlFor="sp2-email">
                                <Mail className="cz-miniIcon" /> البريد الإلكتروني{" "}
                                <span className="cz-required">*</span>
                              </label>
                              <input
                                id="sp2-email"
                                className={`cz-input ${errors.email ? "cz-input--error" : ""}`}
                                type="email"
                                placeholder="ahmed@example.com"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                autoComplete="email"
                              />
                            </div>

                            <div className="cz-field">
                              <label className="cz-label cz-label--icon" htmlFor="sp2-phone">
                                <Phone className="cz-miniIcon" /> رقم الهاتف{" "}
                                <span className="cz-required">*</span>
                              </label>
                              <input
                                id="sp2-phone"
                                className={`cz-input ${errors.phone ? "cz-input--error" : ""}`}
                                type="tel"
                                placeholder="+216 XX XXX XXX"
                                value={formData.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                                autoComplete="tel"
                                inputMode="tel"
                                dir="ltr"
                                style={{ unicodeBidi: "plaintext" }}
                              />
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="cz-card animate-fade-in-delay-200">
                        <header className="cz-card__header">
                          <h2 className="cz-card__title">
                            <span className="cz-bubble" aria-hidden="true">
                              <MapPin className="cz-bubble__icon" />
                            </span>
                            عنوان الشحن
                          </h2>
                        </header>

                        <div className="cz-card__content cz-space-4">
                          <div className="cz-field">
                            <label className="cz-label" htmlFor="sp2-address">
                              العنوان <span className="cz-required">*</span>
                            </label>
                            <input
                              id="sp2-address"
                              className={`cz-input ${errors.address ? "cz-input--error" : ""}`}
                              placeholder="123 شارع محمد الخامس"
                              value={formData.address}
                              onChange={(e) => handleChange("address", e.target.value)}
                              autoComplete="street-address"
                            />
                          </div>

                          <div className="cz-row3">
                            <div className="cz-field">
                              <label className="cz-label" htmlFor="sp2-city">
                                المدينة <span className="cz-required">*</span>
                              </label>
                              <input
                                id="sp2-city"
                                className={`cz-input ${errors.city ? "cz-input--error" : ""}`}
                                placeholder="تونس"
                                value={formData.city}
                                onChange={(e) => handleChange("city", e.target.value)}
                                autoComplete="address-level2"
                              />
                            </div>

                            <div className="cz-field">
                              <label className="cz-label" htmlFor="sp2-state">
                                الولاية <span className="cz-required">*</span>
                              </label>

                              <div className="cz-selectWrap">
                                <select
                                  id="sp2-state"
                                  className={`cz-select ${errors.state ? "cz-input--error" : ""}`}
                                  value={formData.state}
                                  onChange={(e) => handleChange("state", e.target.value)}
                                  aria-label="الولاية"
                                >
                                  <option value="" disabled>
                                    اختر...
                                  </option>
                                  <option value="Tunis">تونس</option>
                                  <option value="Ariana">أريانة</option>
                                  <option value="Ben Arous">بن عروس</option>
                                  <option value="Manouba">منوبة</option>
                                  <option value="Sousse">سوسة</option>
                                  <option value="Sfax">صفاقس</option>
                                  <option value="Nabeul">نابل</option>
                                </select>
                                <span className="cz-selectChevron" aria-hidden="true" />
                              </div>
                            </div>

                            <div className="cz-field">
                              <label className="cz-label" htmlFor="sp2-postal">
                                الرمز البريدي <span className="cz-required">*</span>
                              </label>
                              <input
                                id="sp2-postal"
                                className={`cz-input ${errors.postal ? "cz-input--error" : ""}`}
                                placeholder="2000"
                                value={formData.postal}
                                onChange={(e) => handleChange("postal", e.target.value)}
                                autoComplete="postal-code"
                                inputMode="numeric"
                                dir="ltr"
                                style={{ unicodeBidi: "plaintext" }}
                              />
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="cz-card cz-card--pay animate-fade-in-delay-300">
                        <header className="cz-card__header">
                          <h2 className="cz-card__title">
                            <span className="cz-bubble" aria-hidden="true">
                              <Banknote className="cz-bubble__icon" />
                            </span>
                            طريقة الدفع
                          </h2>
                        </header>

                        <div className="cz-card__content">
                          <div className="cz-codChoice" role="group" aria-label="طريقة الدفع">
                            <div className="cz-codChoice__left">
                              <span className="cz-codChoice__bigBubble" aria-hidden="true">
                                <Banknote className="cz-codChoice__bigIcon" />
                              </span>
                            </div>

                            <div className="cz-codChoice__mid">
                              <p className="cz-codChoice__title">الدفع عند الاستلام</p>
                              <p className="cz-codChoice__sub">ادفع عند وصول الطلب إلى باب منزلك</p>
                            </div>

                            <div className="cz-codChoice__right" aria-hidden="true">
                              <span className="cz-radio">
                                <span className="cz-radio__dot" />
                              </span>
                            </div>
                          </div>

                          <div className="cz-trustLine">
                            <ShieldCheck className="cz-trustLine__icon" />
                            <span>لا يوجد دفع الآن — ادفع فقط عند استلام طلبك</span>
                          </div>
                        </div>
                      </section>

                      <section className="cz-card cz-card--consent animate-fade-in-delay-300">
                        <div className="cz-card__content cz-consent">
                          <p className="cz-consent__line">
                            عند إتمام الطلب فأنت توافق على{" "}
                            <button
                              type="button"
                              className="cz-inlineLink"
                              onClick={() => setOpenWhich("terms")}
                            >
                              الشروط والأحكام
                            </button>{" "}
                            و{" "}
                            <button
                              type="button"
                              className="cz-inlineLink"
                              onClick={() => setOpenWhich("privacy")}
                            >
                              سياسة الخصوصية
                            </button>
                            .
                          </p>

                          <label className="cz-agreeRow">
                            <input
                              type="checkbox"
                              className="cz-checkbox"
                              checked={agree}
                              onChange={(e) => setAgree(e.target.checked)}
                            />
                            <span className="cz-agreeText">أوافق</span>
                          </label>

                          <p className="cz-consent__hint">
                            لن يتم تأكيد الطلب إلا بعد الموافقة على الشروط والسياسة.
                          </p>
                        </div>
                      </section>
                    </form>
                  </div>

                  <div className="cz-right animate-fade-in-delay-300">
                    <section className="cz-card cz-sticky">
                      <header className="cz-card__header">
                        <h2 className="cz-card__title">
                          <Package className="cz-packIcon" />
                          ملخص الطلب
                        </h2>
                      </header>

                      <div className="cz-card__content">
                        <div className="cz-summary">
                          <div className="sp2-summaryReference">
                            <span className="sp2-summaryReferenceLabel"> (منتج) Product ID</span>
                            <strong className="sp2-summaryReferenceValue" dir="ltr">
                              #{productDisplayId}
                            </strong>
                          </div>

                          <div className="cz-items cz-items--withImg">
                            {checkoutSummaryItems.length ? (
                              checkoutSummaryItems.map((item) => (
                                <div className="cz-item cz-item--img" key={item.key}>
                                  <div className="cz-item__thumb cz-item__thumb--lg" aria-hidden="true">
                                    {item.image ? (
                                      <img
                                        src={getImgUrl(item.image)}
                                        alt={item.title}
                                        loading="lazy"
                                        decoding="async"
                                        className="cz-item__img"
                                      />
                                    ) : (
                                      <div className="cz-item__imgFallback" title="لا توجد صورة">
                                        <ImageIcon size={18} />
                                      </div>
                                    )}
                                  </div>

                                  <div className="cz-item__main">
                                    <div className="cz-item__top cz-item__top--single">
                                      <p className="cz-item__name">{item.title}</p>
                                    </div>

                                    <p className="cz-item__meta">
                                      <span dir="ltr">#{item.productId}</span>
                                      {item.size ? ` · المقاس: ${item.size}` : ""}
                                      {" · "}اللون: {item.colorLabel}
                                      {" · "}الكمية: {item.quantity}
                                    </p>

                                    <div className="sp2-checkoutPriceNote">
                                      <span className="sp2-checkoutPriceNoteLabel">سعر القطعة</span>
                                      <p className="sp2-checkoutImportantText">
                                        قبل تأكيد الطلب، اتصل بالبائع على
                                        <strong dir="ltr"> {VENDOR_PHONE} </strong>
                                        لمعرفة السعر النهائي لهذا المنتج{" "}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="cz-empty">لا توجد منتجات في السلة.</div>
                            )}
                          </div>

                          <div className="cz-sep" />

                          <button
                            className="cz-btnLuxury"
                            form="sp2-checkout-form"
                            type="submit"
                            disabled={isCreatingOrder || !agree}
                            title={!agree ? "يرجى الموافقة على الشروط أولًا" : ""}
                          >
                            <Truck className="cz-btnIcon" />
                            {isCreatingOrder ? "جارٍ التأكيد..." : "تأكيد الطلب — الدفع عند الاستلام"}
                          </button>

                          <p className="cz-terms">
                            بإتمام الطلب، أنت توافق على الشروط والأحكام وسياسة الخصوصية.
                            سيتم تحديد السعر النهائي مباشرةً مع البائع عبر الرقم
                            <strong dir="ltr"> {VENDOR_PHONE} </strong>.
                          </p>

                          <div className="cz-sep" />

                          <div className="cz-badges">
                            <div className="cz-badge">
                              <ShieldCheck className="cz-badge__icon" />
                              <span>طلب آمن</span>
                            </div>
                            <div className="cz-badge">
                              <Truck className="cz-badge__icon" />
                              <span>توصيل مجاني</span>
                            </div>
                            <div className="cz-badge">
                              <Banknote className="cz-badge__icon" />
                              <span>الدفع عند الاستلام</span>
                            </div>
                            <div className="cz-badge">
                              <Package className="cz-badge__icon" />
                              <span>جودة مضمونة</span>
                            </div>
                          </div>

                          <button type="button" className="cz-back" onClick={handleBackToTop}>
                            الرجوع إلى أعلى الصفحة
                          </button>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </section>
            </div>
          </FadeInSection>
        )}

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

        <TermsModal
          open={openWhich === "terms"}
          onClose={() => setOpenWhich(null)}
          title="الشروط والأحكام"
          isRTL
        >
          <article className="prose-wz" dir="rtl" lang="ar" role="document">
            <p>
              باستخدام موقع وبوتيك <strong>«وهرة زمان»</strong> وخدمة الشراء عبر الإنترنت، فإنك
              توافق على الشروط التالية المنظمة لعملية الطلب والتوصيل داخل تونس. بوتيك «وهرة زمان»
              متواجد في <strong>المدينة العتيقة بتونس، سوق الصوف</strong>.
            </p>

            <ul className="wz-bullets">
              <li>
                طريقة الدفع المعتمدة حاليًا هي <strong>الدفع عند الاستلام</strong>.
              </li>
              <li>بعد تأكيد الطلب، يتم الشروع في تجهيزه وتحديد موعد التوصيل.</li>
              <li>في حال تعذّر الاتصال بك، قد يتم تأجيل أو إلغاء الطلب.</li>
              <li>
                <strong>التوصيل مجاني</strong> داخل تونس.
              </li>
            </ul>

            <p>نسعى في <strong>«وهرة زمان»</strong> إلى تقديم تجربة شراء راقية وآمنة.</p>
          </article>
        </TermsModal>

        <TermsModal
          open={openWhich === "privacy"}
          onClose={() => setOpenWhich(null)}
          title="سياسة الخصوصية"
          isRTL
        >
          <article className="prose-wz" dir="rtl" lang="ar" role="document">
            <p>
              في <strong>«وهرة زمان»</strong>، نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية
              واستخدامها فقط لمعالجة طلباتك وتقديم خدمة آمنة.
            </p>

            <ul className="wz-bullets">
              <li>نجمع: الاسم، الهاتف، العنوان، البريد الإلكتروني.</li>
              <li>نستخدم البيانات لتأكيد الطلب، التحضير، والتوصيل.</li>
              <li>لا نبيع ولا نشارك بياناتك لأغراض تسويقية مع أي طرف ثالث.</li>
            </ul>

            <p>بإتمام الطلب، فإنك توافق على سياسة الخصوصية هذه.</p>
          </article>
        </TermsModal>
      </div>
    </div>
  );
};

export default SingleProduct;