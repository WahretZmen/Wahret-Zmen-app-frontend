// src/pages/OrderSuccess.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Sparkles, ArrowLeft, Search, Copy } from "lucide-react";

import Header from "../components/ui/Header.jsx";
import Footer from "../components/ui/Footer.jsx";

import "../Styles/StylesOrderSuccess.css";

const safeText = (v) => (typeof v === "string" ? v.trim() : String(v ?? "").trim());

const readStoredOrder = (orderId) => {
  try {
    const byId = sessionStorage.getItem(`wz_order_${String(orderId)}`);
    if (byId) return JSON.parse(byId);

    const last = sessionStorage.getItem("wz_last_order");
    if (!last) return null;
    const parsed = JSON.parse(last);
    const storedId = safeText(parsed?.orderId);
    if (storedId && safeText(orderId) && storedId !== safeText(orderId)) return null;
    return parsed?.order || null;
  } catch (_) {
    return null;
  }
};

const persistOrderSnapshot = (orderId, order) => {
  const id = safeText(orderId);
  if (!id || !order) return;

  try {
    sessionStorage.setItem(
      "wz_last_order",
      JSON.stringify({ orderId: id, order, savedAt: Date.now() })
    );
  } catch (_) {}

  try {
    sessionStorage.setItem(`wz_order_${id}`, JSON.stringify(order));
  } catch (_) {}
};

export default function OrderSuccess() {
  const { orderId } = useParams();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  const order = useMemo(() => {
    return location.state?.order || readStoredOrder(orderId) || null;
  }, [location.state, orderId]);

  const ref = safeText(order?.orderId || order?._id || orderId || "WZ-2026-ORDER");

  useEffect(() => {
    document.documentElement.dir = "rtl";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (ref && order) {
      persistOrderSnapshot(ref, order);
    }
  }, [ref, order]);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(String(ref || ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="wz-os" dir="rtl" lang="ar">
      <Header />

      <main className="wz-os__main">
        <div className="wz-os__container">
          <header className="wz-os__hero wz-os-anim">
            <div className="wz-os__badge">
              <Sparkles size={34} />
            </div>
            <h1 className="wz-os__title">تم تأكيد الطلب</h1>
            <p className="wz-os__sub">شكرًا لك! تم تسجيل طلبك بنجاح — الدفع عند الاستلام.</p>
          </header>

          {/* Main card */}
          <section className="wz-os__card wz-os-anim wz-os-anim--d1">
            <div className="wz-os__cardBody">
              <div className="wz-os__row">
                <div>
                  <div className="wz-os__muted">رقم الطلب</div>
                  <div
                    className="wz-os__ref"
                    style={{ direction: "ltr", unicodeBidi: "plaintext" }}
                  >
                    {ref}
                  </div>
                </div>

                <Link
                  to={`/order-track/${encodeURIComponent(ref)}`}
                  state={{ order }}
                  className="wz-os__linkBtn"
                >
                  <button className="wz-os__btn wz-os__btn--primary" type="button">
                    تتبّع الطلب الآن <ArrowLeft size={16} />
                  </button>
                </Link>
              </div>

              <div className="wz-os__note">
                يرجى الاحتفاظ برقم الطلب لتتبّع حالة الشحن في أي وقت.
              </div>

              <div className="wz-os__actions">
                <Link to="/" className="wz-os__actionLink">
                  <button className="wz-os__btn wz-os__btn--ghost" type="button">
                    متابعة التسوّق
                  </button>
                </Link>

                <Link
                  to={`/order-confirm/${encodeURIComponent(ref)}`}
                  state={{ order }}
                  className="wz-os__actionLink"
                >
                  <button className="wz-os__btn wz-os__btn--soft" type="button">
                    عرض تفاصيل الطلب
                  </button>
                </Link>
              </div>
            </div>
          </section>

          {/* Tracking Guide */}
          <section className="wz-os__card wz-os__card--guide wz-os-anim wz-os-anim--d1">
            <div className="wz-os__cardBody wz-os__cardBody--lg">
              <div className="wz-os__guideHead">
                <div className="wz-os__guideIcon">
                  <Search size={18} />
                </div>

                <div className="wz-os__guideText">
                  <h2 className="wz-os__sectionTitle wz-os__sectionTitle--tight">
                    كيف تتابع طلبك باستخدام رقم الطلب؟
                  </h2>
                  <p className="wz-os__guideSub">
                    إذا كنت تطلب كضيف (بدون حساب)، يمكنك دائمًا تتبّع طلبك: انسخ رقم الطلب، ثم
                    الصقه في صفحة التتبّع واضغط “تتبّع”.
                  </p>
                </div>
              </div>

              <div className="wz-os__guideSteps">
                <div className="wz-os__gStep">
                  <div className="wz-os__gNum">1</div>
                  <div className="wz-os__gStepBody">
                    <div className="wz-os__gStepTitle">انسخ رقم الطلب</div>
                    <div className="wz-os__gStepDesc">
                      اضغط “نسخ رقم الطلب” لتجنّب أي خطأ أثناء الكتابة.
                    </div>
                  </div>
                </div>

                <div className="wz-os__gStep">
                  <div className="wz-os__gNum">2</div>
                  <div className="wz-os__gStepBody">
                    <div className="wz-os__gStepTitle">افتح صفحة التتبّع</div>
                    <div className="wz-os__gStepDesc">
                      اضغط “تتبّع الطلب الآن” للانتقال مباشرةً إلى صفحة التتبّع.
                    </div>
                  </div>
                </div>

                <div className="wz-os__gStep">
                  <div className="wz-os__gNum">3</div>
                  <div className="wz-os__gStepBody">
                    <div className="wz-os__gStepTitle">الصق الرقم واضغط “تتبّع”</div>
                    <div className="wz-os__gStepDesc">
                      ستظهر حالة الطلب والمنتجات وبيانات العميل (طلب كضيف) عند توفرها.
                    </div>
                  </div>
                </div>
              </div>

              <div className="wz-os__guideCtas">
                <Link
                  to={`/order-track/${encodeURIComponent(ref)}`}
                  state={{ order }}
                  className="wz-os__actionLink wz-os__actionLink--wide"
                >
                  <button className="wz-os__btn wz-os__btn--primary" type="button">
                    تتبّع الطلب الآن <ArrowLeft size={16} />
                  </button>
                </Link>

                <button className="wz-os__btn wz-os__btn--outline" type="button" onClick={copyId}>
                  نسخ رقم الطلب <Copy size={16} />
                </button>
              </div>

              {copied ? <div className="wz-os__toast">تم النسخ!</div> : null}

              <div className="wz-os__guideHint">
                <span className="wz-os__guideHintStrong">ملاحظة:</span> يُفضّل أخذ لقطة شاشة
                لرقم الطلب أو حفظه في الملاحظات للرجوع إليه لاحقًا.
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}