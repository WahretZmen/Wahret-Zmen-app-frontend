// src/pages/CheckoutPage.jsx
import React, { useMemo, useState, useEffect, useRef, useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import {
  Banknote,
  Truck,
  ShieldCheck,
  MapPin,
  User,
  Phone,
  Mail,
  ChevronLeft,
  Package,
  Image as ImageIcon,
  X,
} from "lucide-react";

import Header from "../../components/ui/Header.jsx";
import Footer from "../../components/ui/Footer.jsx";

import { clearCart } from "../../redux/features/cart/cartSlice.js";
import { useCreateOrderMutation } from "../../redux/features/orders/ordersApi.js";
import productsApi from "../../redux/features/products/productsApi.js";

import { getImgUrl } from "../../utils/getImgUrl";
import "../../Styles/StylesCheckoutPage.css";

const VENDOR_PHONE = "+216 55 495 816";

const safeText = (v) =>
  typeof v === "string" ? v.trim() : String(v ?? "").trim();

const getProductId = (it) =>
  safeText(
    it?.productId ||
      it?.id ||
      it?._id ||
      it?.product?.productId ||
      it?.product?.id ||
      it?.product?._id
  );

const pickItemImage = (it) => {
  const images = Array.isArray(it?.color?.images) ? it.color.images.filter(Boolean) : [];
  return it?.color?.image || images[0] || it?.coverImage || it?.image || it?.thumbnail || "";
};

const TermsModal = ({ open, onClose, title, children, isRTL = true }) => {
  const dialogRef = useRef(null);
  const [visible, setVisible] = useState(open);
  const titleId = useId();

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

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((s) => s.cart.cartItems || []);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) =>
          acc + Number(item?.newPrice || 0) * Number(item?.quantity || 0),
        0
      ),
    [cartItems]
  );

  const shipping = 0;
  const total = useMemo(() => subtotal + shipping, [subtotal, shipping]);

  const [createOrder, { isLoading }] = useCreateOrderMutation();

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

  useEffect(() => {
    // if (!cartItems.length) navigate("/cart");
  }, [cartItems.length, navigate]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const validate = () => {
    if (!cartItems.length) return { msg: "سلة المشتريات فارغة.", fields: {} };

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
      if (!safeText(formData[f])) next[f] = true;
    });

    if (Object.keys(next).length) {
      return { msg: "الرجاء إدخال كل المعلومات المطلوبة.", fields: next };
    }

    if (!agree) {
      return {
        msg: "يرجى الموافقة على الشروط والأحكام وسياسة الخصوصية قبل تأكيد الطلب.",
        fields: {},
      };
    }

    return { msg: "", fields: {} };
  };

  const buildPayload = () => {
    const products = cartItems.map((it) => {
      const productId = getProductId(it);

      const colorName =
        it?.color?.colorName?.ar ||
        it?.color?.colorName?.fr ||
        it?.color?.colorName?.en ||
        (typeof it?.color?.colorName === "string" ? it.color.colorName : "") ||
        "Default";

      const images = Array.isArray(it?.color?.images)
        ? it.color.images.filter(Boolean)
        : [];

      const mainImg = it?.color?.image || images[0] || it?.coverImage || "";

      return {
        productId,
        quantity: Number(it?.quantity || 1),
        color: {
          colorName,
          image: mainImg,
          images: images.length ? images : mainImg ? [mainImg] : [],
        },
        colorKey: safeText(it?.colorKey || ""),
        size: safeText(it?.size || it?.selectedSize || ""),
      };
    });

    const fullName = `${safeText(formData.firstName)} ${safeText(
      formData.lastName
    )}`.trim();

    return {
      name: fullName,
      email: safeText(formData.email),
      phone: safeText(formData.phone),
      address: {
        street: safeText(formData.address),
        city: safeText(formData.city),
        state: safeText(formData.state),
        country: "Tunisia",
        zipcode: safeText(formData.postal),
      },
      products,
      paymentMethod: "cod",
      totals: {
        subtotal: Number(subtotal.toFixed(2)),
        shipping: 0,
        total: Number(total.toFixed(2)),
      },
      consent: { agreed: true, at: new Date().toISOString() },
    };
  };

  const submit = async (e) => {
    e.preventDefault();

    const v = validate();
    if (v.msg) {
      setErrors(v.fields || {});
      Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: v.msg,
        confirmButtonText: "حسنًا",
      });
      return;
    }

    try {
      const payload = buildPayload();

      const hasInvalidProduct = payload.products.some((p) => !safeText(p.productId));
      if (hasInvalidProduct) {
        throw new Error("يوجد منتج بدون معرّف productId صالح.");
      }

      const res = await createOrder(payload).unwrap();

      const order = res?.order || res?.data?.order || res || null;
      const orderId =
        order?.orderId || order?._id || res?.orderId || res?._id || "";

      if (!orderId) {
        throw new Error("لم يتم استلام مرجع الطلب من السيرفر.");
      }

      try {
        sessionStorage.setItem(
          "wz_last_order",
          JSON.stringify({ orderId: String(orderId), order, savedAt: Date.now() })
        );
      } catch (_) {}

      dispatch(
        productsApi.util.invalidateTags([{ type: "Products", id: "LIST" }])
      );

      dispatch(clearCart());

      navigate(`/order-success/${encodeURIComponent(orderId)}`, {
        state: { order },
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "فشل إنشاء الطلب",
        text: err?.data?.message || err?.message || "حدث خطأ غير متوقع.",
        confirmButtonText: "حسنًا",
      });
    }
  };

  return (
    <div className="cz-page cz-rtl" dir="rtl" lang="ar">
      <Header />

      <main className="cz-main">
        <div className="cz-container">
          <div className="cz-breadcrumb animate-fade-in-up" aria-label="مسار الصفحات">
            <Link to="/cart" className="cz-breadcrumb__link">
              السلة
            </Link>

            <ChevronLeft className="cz-breadcrumb__icon" />

            <span className="cz-breadcrumb__muted">التأكيد</span>

            <ChevronLeft className="cz-breadcrumb__icon" />

            <span className="cz-breadcrumb__current">الدفع</span>
          </div>

          <div className="cz-hero animate-fade-in-delay-100">
            <h1 className="cz-h1">إتمام الطلب بأمان</h1>
            <p className="cz-subtitle">أكمل طلبك — الدفع عند الاستلام</p>

            <div className="cz-freeShipLine" aria-live="polite">
              <Truck className="cz-freeShipLine__icon" />
              <span>
                التوصيل <strong>مجاني</strong> داخل تونس
              </span>
            </div>
          </div>

          <div className="cz-grid">
            <div className="cz-left">
              <form id="cz-checkout-form" className="cz-formWrap" onSubmit={submit}>
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
                        <label className="cz-label" htmlFor="firstName">
                          الاسم <span className="cz-required">*</span>
                        </label>
                        <input
                          id="firstName"
                          className={`cz-input ${errors.firstName ? "cz-input--error" : ""}`}
                          placeholder="أحمد"
                          value={formData.firstName}
                          onChange={(e) => handleChange("firstName", e.target.value)}
                          autoComplete="given-name"
                        />
                      </div>

                      <div className="cz-field">
                        <label className="cz-label" htmlFor="lastName">
                          اللقب <span className="cz-required">*</span>
                        </label>
                        <input
                          id="lastName"
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
                        <label className="cz-label cz-label--icon" htmlFor="email">
                          <Mail className="cz-miniIcon" /> البريد الإلكتروني{" "}
                          <span className="cz-required">*</span>
                        </label>
                        <input
                          id="email"
                          className={`cz-input ${errors.email ? "cz-input--error" : ""}`}
                          type="email"
                          placeholder="ahmed@example.com"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          autoComplete="email"
                        />
                      </div>

                      <div className="cz-field">
                        <label className="cz-label cz-label--icon" htmlFor="phone">
                          <Phone className="cz-miniIcon" /> رقم الهاتف{" "}
                          <span className="cz-required">*</span>
                        </label>
                        <input
                          id="phone"
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
                      <label className="cz-label" htmlFor="address">
                        العنوان <span className="cz-required">*</span>
                      </label>
                      <input
                        id="address"
                        className={`cz-input ${errors.address ? "cz-input--error" : ""}`}
                        placeholder="123 شارع محمد الخامس"
                        value={formData.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        autoComplete="street-address"
                      />
                    </div>

                    <div className="cz-row3">
                      <div className="cz-field">
                        <label className="cz-label" htmlFor="city">
                          المدينة <span className="cz-required">*</span>
                        </label>
                        <input
                          id="city"
                          className={`cz-input ${errors.city ? "cz-input--error" : ""}`}
                          placeholder="تونس"
                          value={formData.city}
                          onChange={(e) => handleChange("city", e.target.value)}
                          autoComplete="address-level2"
                        />
                      </div>

                      <div className="cz-field">
                        <label className="cz-label" htmlFor="state">
                          الولاية <span className="cz-required">*</span>
                        </label>

                        <div className="cz-selectWrap">
                          <select
                            id="state"
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
                        <label className="cz-label" htmlFor="postal">
                          الرمز البريدي <span className="cz-required">*</span>
                        </label>
                        <input
                          id="postal"
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
                    <div className="cz-items cz-items--withImg">
                      {cartItems.length ? (
                        cartItems.slice(0, 8).map((it, idx) => {
                          const pid = getProductId(it);

                          const title =
                            it?.translations?.ar?.title ||
                            it?.translations?.fr?.title ||
                            it?.translations?.en?.title ||
                            it?.title ||
                            "منتج";

                          const qty = Number(it?.quantity || 1);
                          const size = safeText(it?.size || it?.selectedSize || "");

                          const rawImg = pickItemImage(it);
                          const src = rawImg ? getImgUrl(rawImg) : "";

                          return (
                            <div
                              className="cz-item cz-item--img"
                              key={`${pid}-${it.colorKey || idx}`}
                            >
                              <div
                                className="cz-item__thumb cz-item__thumb--lg"
                                aria-hidden="true"
                              >
                                {src ? (
                                  <img
                                    src={src}
                                    alt={title}
                                    loading="lazy"
                                    decoding="async"
                                    className="cz-item__img"
                                  />
                                ) : (
                                  <div
                                    className="cz-item__imgFallback"
                                    title="لا توجد صورة"
                                  >
                                    <ImageIcon size={18} />
                                  </div>
                                )}
                              </div>

                              <div className="cz-item__main">
                                <div className="cz-item__top cz-item__top--single">
                                  <p className="cz-item__name">{title}</p>
                                </div>

                                <p className="cz-item__meta">
                                  <span dir="ltr">#{pid}</span>
                                  {size ? ` · المقاس: ${size}` : ""}
                                  {" · "}الكمية: {qty}
                                </p>

                                <div className="cz-priceHintCard">
                                  <div className="cz-priceHintCard__label">
                                    سعر القطعة
                                  </div>
                                  <p className="cz-priceHintCard__text">
                                    لمعرفة السعر، يُرجى التواصل مع البائع على الرقم{" "}
                                    <strong dir="ltr">{VENDOR_PHONE}</strong>
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="cz-empty">لا توجد منتجات في السلة.</div>
                      )}
                    </div>

                    <div className="cz-sep" />

                    <div className="cz-breakdown">
                      <div className="cz-priceHintCard cz-priceHintCard--summary">
                        <div className="cz-priceHintCard__label">سعر الطلب</div>
                        <p className="cz-priceHintCard__text">
                          السعر النهائي يتم تأكيده مباشرة مع البائع عبر الرقم{" "}
                          <strong dir="ltr">{VENDOR_PHONE}</strong>
                        </p>
                      </div>

                      <div className="cz-line">
                        <span className="cz-muted">التوصيل</span>
                        <span className="cz-green">مجاني</span>
                      </div>
                    </div>

                    <button
                      className="cz-btnLuxury"
                      form="cz-checkout-form"
                      type="submit"
                      disabled={isLoading || !agree}
                      title={!agree ? "يرجى الموافقة على الشروط أولاً" : ""}
                    >
                      <Truck className="cz-btnIcon" />
                      {isLoading ? "جارٍ التأكيد..." : "تأكيد الطلب — الدفع عند الاستلام"}
                    </button>

                    <p className="cz-terms">
                      بإتمام الطلب، أنت توافق على الشروط والأحكام وسياسة الخصوصية.
                      سيتم تحديد السعر النهائي مباشرة مع البائع.{" "}
                      <span className="cz-freeShipInline">التوصيل مجاني.</span>
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

                    <Link to="/cart" className="cz-back">
                      الرجوع إلى السلة
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          </div>

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
      </main>

      <Footer />
    </div>
  );
}