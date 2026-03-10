// src/pages/products/CartPage.jsx

import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, PhoneCall } from "lucide-react";

// Layout
import Header from "../../components/ui/Header.jsx";
import Footer from "../../components/ui/Footer.jsx";
import { Card, CardContent } from "../../components/ui/card.jsx";

// Utils
import getImgUrl from "../../utils/getImgUrl.js";

// Redux actions
import {
  clearCart,
  removeFromCart,
  updateQuantity,
} from "../../redux/features/cart/cartSlice.js";

// Styles
import "../../Styles/StylesCartPage.css";

/* =============================================================================
   Helpers
============================================================================= */

const VENDOR_PHONE = "+216 55 495 816";

const isArabicText = (s) =>
  typeof s === "string" && /[\u0600-\u06FF]/.test(s);

const normalizeKey = (s) => {
  if (!s) return "";
  return String(s)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
};

const CATEGORY_AR_MAP = {
  hommes: "رجال",
  homme: "رجال",
  men: "رجال",
  man: "رجال",
  male: "رجال",

  femmes: "نساء",
  femme: "نساء",
  women: "نساء",
  woman: "نساء",
  female: "نساء",

  enfants: "أطفال",
  enfant: "أطفال",
  kids: "أطفال",
  kid: "أطفال",
  children: "أطفال",
  child: "أطفال",

  couffin: "قفّة",
  panier: "قفّة",

  vetement: "ملابس",
  vetements: "ملابس",
  clothing: "ملابس",
  clothes: "ملابس",

  accessoires: "إكسسوارات",
  accessoire: "إكسسوارات",
  accessories: "إكسسوارات",
  accessory: "إكسسوارات",
};

const safeText = (v) =>
  typeof v === "string" ? v.trim() : String(v ?? "").trim();

const getProductId = (p) =>
  safeText(
    p?.productId ||
      p?.id ||
      p?._id ||
      p?.product?.productId ||
      p?.product?.id ||
      p?.product?._id
  );

/* =============================================================================
   Component
============================================================================= */

const CartPage = () => {
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const dispatch = useDispatch();
  const cartItems = useSelector((s) => s.cart.cartItems || []);

  const lang = "ar";
  const isRTL = true;

  const titleFor = (p) =>
    p?.translations?.ar?.title || p?.titleAr || p?.title || "بدون عنوان";

  const categoryFor = (p) => {
    const raw =
      p?.translations?.ar?.category ||
      p?.categoryAr ||
      p?.category ||
      p?.product?.category ||
      p?.productData?.category;

    if (!raw) return "غير مصنّف";

    if (typeof raw === "object" && raw !== null) {
      const v =
        raw.ar ||
        raw["ar-SA"] ||
        raw["ar_TN"] ||
        raw.fr ||
        raw.en ||
        Object.values(raw).find(
          (x) => typeof x === "string" && x.trim().length > 0
        );
      if (!v) return "غير مصنّف";
      if (isArabicText(v)) return v.trim();
      const k = normalizeKey(v);
      return CATEGORY_AR_MAP[k] || v;
    }

    if (Array.isArray(raw)) {
      const first = raw.find((x) => typeof x === "string" && x.trim().length);
      if (!first) return "غير مصنّف";
      if (isArabicText(first)) return first.trim();
      const k = normalizeKey(first);
      return CATEGORY_AR_MAP[k] || first;
    }

    const str = String(raw).trim();
    if (!str) return "غير مصنّف";
    if (isArabicText(str)) return str;

    const key = normalizeKey(str);
    return CATEGORY_AR_MAP[key] || str;
  };

  const embroideryFor = (item) => {
    const raw =
      item?.embroideryCategory ||
      item?.embroidery ||
      item?.product?.embroideryCategory ||
      item?.productData?.embroideryCategory;

    if (!raw) return null;
    if (typeof raw === "string") return raw;

    if (typeof raw === "object") {
      const v =
        raw.ar ||
        raw["ar-SA"] ||
        raw.fr ||
        raw.en ||
        Object.values(raw).find(
          (x) => typeof x === "string" && x.trim().length > 0
        );
      return v || null;
    }

    return null;
  };

  const colorLabelFor = (product) => {
    const c = product?.color;
    if (!c) return "أصلي";

    const v =
      c?.name?.[lang] ||
      c?.colorName?.[lang] ||
      (typeof c?.name === "string" ? c.name : "") ||
      (typeof c?.colorName === "string" ? c.colorName : "") ||
      c?.name?.en ||
      c?.colorName?.en ||
      "أصلي";

    return safeText(v) || "أصلي";
  };

  const setQuantity = (product, quantity) => {
    const max =
      typeof product?.color?.stock === "number" ? product.color.stock : 999;

    const next = Math.min(Math.max(1, Number(quantity) || 1), max);
    const productId = getProductId(product);

    if (next !== Number(product.quantity || 1) && productId) {
      dispatch(
        updateQuantity({
          productId,
          color: product.color,
          coverImage: product.coverImage,
          colorKey: product.colorKey,
          quantity: next,
        })
      );
    }
  };

  const inc = (p) => setQuantity(p, Number(p.quantity || 1) + 1);
  const dec = (p) => setQuantity(p, Number(p.quantity || 1) - 1);

  const handleRemove = (product) => {
    const productId = getProductId(product);
    if (!productId) return;

    dispatch(
      removeFromCart({
        productId,
        color: product.color,
        coverImage: product.coverImage,
        colorKey: product.colorKey,
      })
    );
  };

  const handleClearCart = () => cartItems.length && dispatch(clearCart());

  const totals = useMemo(() => {
    const shipping = cartItems.length ? 0 : 0;
    return { shipping };
  }, [cartItems]);

  return (
    <div
      className="cart-page min-h-screen bg-background"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Header />

      <main className="py-10 md:py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-8 text-center md:text-left animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              سلة المشتريات
            </h1>
            <p className="text-muted-foreground">
              راجع المنتجات التي اخترتها قبل إتمام الطلب
            </p>
          </div>

          {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((product, index) => {
                  const productId = getProductId(product);

                  const imgSrc = getImgUrl(
                    product?.color?.images?.[0] ||
                      product?.color?.image ||
                      product?.coverImage
                  );

                  const maxStock =
                    typeof product?.color?.stock === "number"
                      ? product.color.stock
                      : undefined;

                  const colorLabel = colorLabelFor(product);
                  const embroideryLabel =
                    embroideryFor(product) || "بدون تطريز خاص";

                  return (
                    <Card
                      key={`${productId}-${product.colorKey || index}`}
                      className={`cart-card rounded-none animate-fade-in-delay-${
                        (index + 1) * 100
                      }`}
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="cart-row flex flex-col md:flex-row items-center md:items-stretch gap-4 md:gap-6">
                          <div className="cart-img-box">
                            <img
                              src={imgSrc}
                              alt={titleFor(product)}
                              className="cart-img"
                              onError={(e) => {
                                e.currentTarget.src = "/default-image.jpg";
                              }}
                            />
                          </div>

                          <div className="flex-1 w-full">
                            <div className="flex flex-wrap justify-between items-start gap-3 mb-2">
                              <h3 className="text-lg sm:text-xl font-semibold text-foreground text-center md:text-start w-full md:w-auto">
                                <Link
                                  to={`/products/${encodeURIComponent(productId)}`}
                                  className="hover:underline"
                                >
                                  {titleFor(product)}
                                </Link>
                              </h3>

                              <button
                                className="remove-btn inline-flex h-9 w-9 items-center justify-center border border-neutral-300 bg-white text-red-600 shadow-sm hover:bg-neutral-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition"
                                aria-label="حذف المنتج"
                                onClick={() => handleRemove(product)}
                                title="حذف المنتج"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="text-sm text-muted-foreground mb-4 space-y-1 text-center md:text-start">
                              <p>
                                <span className="font-semibold text-foreground">ID:</span>{" "}
                                <span dir="ltr" className="text-foreground">
                                  #{productId}
                                </span>
                              </p>

                              <p>
                                الفئة:{" "}
                                <span className="text-foreground">
                                  {categoryFor(product)}
                                </span>
                              </p>

                              <p className="capitalize">
                                نوع التطريز:{" "}
                                <span className="text-foreground">
                                  {embroideryLabel}
                                </span>
                              </p>

                              <p className="capitalize">اللون: {colorLabel}</p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4">
                              <div className="cart-price-contactHint">
                                <div className="cart-price-contactHint__head">
                                  <span className="cart-price-contactHint__label">
                                    سعر القطعة
                                  </span>
                                </div>

                                <p className="cart-price-contactHint__text">
                                  لمعرفة السعر، يُرجى التواصل مع البائع على الرقم{" "}
                                  <strong dir="ltr">{VENDOR_PHONE}</strong>
                                </p>
                              </div>

                              <div
                                className="qty-group flex items-center gap-3"
                                role="group"
                                aria-label="الكمية"
                              >
                                <button
                                  className="qty-btn inline-flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center border border-neutral-300 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50 active:scale-95 focus:outline-none transition disabled:opacity-40"
                                  aria-label="إنقاص الكمية"
                                  disabled={Number(product.quantity || 1) <= 1}
                                  onClick={() =>
                                    Number(product.quantity || 1) > 1 &&
                                    dec(product)
                                  }
                                >
                                  <Minus className="h-4 w-4" />
                                </button>

                                <span className="qty-val font-medium text-base min-w-6 text-center select-none">
                                  {Number(product.quantity || 1)}
                                </span>

                                <button
                                  className="qty-btn inline-flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center border border-neutral-300 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50 active:scale-95 focus:outline-none transition disabled:opacity-40"
                                  aria-label="زيادة الكمية"
                                  disabled={
                                    typeof maxStock === "number" &&
                                    Number(product.quantity || 1) >= maxStock
                                  }
                                  onClick={() =>
                                    !(
                                      typeof maxStock === "number" &&
                                      Number(product.quantity || 1) >= maxStock
                                    ) && inc(product)
                                  }
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                <div className="animate-fade-in-up">
                  <button
                    className="w-full h-12 px-4 inline-flex items-center justify-center bg-red-600 text-white font-semibold tracking-wide shadow-sm hover:bg-red-700 active:scale-[.99] transition"
                    onClick={handleClearCart}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    تفريغ العربة
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="animate-fade-in-delay-300">
                <Card className="order-summary rounded-none lg:sticky lg:top-24">
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-semibold text-foreground mb-6 text-center md:text-left">
                      ملخص الطلب
                    </h3>

                    <div className="space-y-4 mb-6">
                      <div className="cart-summaryHint">
                        <div className="cart-summaryHint__label">سعر المنتجات</div>
                        <p className="cart-summaryHint__text">
                          لمعرفة السعر النهائي، يرجى التواصل مع البائع على الرقم{" "}
                          <strong dir="ltr">{VENDOR_PHONE}</strong>
                        </p>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">التوصيل</span>
                        <span className="font-medium">
                          {totals.shipping === 0 ? "مجاني" : "مجاني"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">طريقة الدفع</span>
                        <span className="font-semibold">الدفع عند الاستلام</span>
                      </div>
                    </div>

                    <div className="cart-buttons">
                      <Link to="/checkout">
                        <button className="btn-brown-gradient">
                          المتابعة لإتمام الطلب
                        </button>
                      </Link>

                      <Link to="/products">
                        <button className="btn-outline">مواصلة التسوق</button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 animate-fade-in">
              <ShoppingBag className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                سلة المشتريات فارغة
              </h2>
              <p className="text-muted-foreground mb-8">
                اكتشف مجموعتنا الجميلة من الجُبَب التقليدية
              </p>
              <Link to="/products">
                <button className="cart-btn w-48 mx-auto block bg-orange-600 hover:bg-orange-700">
                  ابدأ التسوق
                </button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;