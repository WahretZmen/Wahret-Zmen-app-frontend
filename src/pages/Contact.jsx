// src/pages/Contact.jsx
// -----------------------------------------------------------------------------
// Contact page (Premium / Pro) — Arabic RTL content
// Hero + geometric pattern + info cards + form + sidebar + map
// -----------------------------------------------------------------------------

import React, { useState, useEffect } from "react";
import ContactForm from "../components/Contact-form.jsx";
import "../Styles/StylesContact.css";
import "../Styles/StylesContact-form.css";
import FadeInSection from "../Animations/FadeInSection.jsx";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Instagram,
  Facebook,
} from "lucide-react";

const Contact = () => {
  const [successMessage, setSuccessMessage] = useState(null);

  // Scroll to top on mount (and handle #top/hash usage)
  const location = useLocation();
  useEffect(() => {
    const shouldScroll =
      location.hash === "#top" ||
      Boolean(location.state && location.state.scrollTop) ||
      true;

    if (shouldScroll) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });

      // Clean the hash so it does not jump again
      if (location.hash === "#top" && window.history.replaceState) {
        const { pathname, search } = window.location;
        window.history.replaceState(null, "", pathname + search);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const CONTACT = {
    city: "تونس، تونس",
    area: "المدينة العربي، سوق الصوف",
    address:
      "Tunis, Rue Mohamed Abd el Wahab, Résidence Green Manar 1, Bloc C, App. 22",
    email1: "emnabes930@gmail.com",
    email2: "wahretzmensabri521@gmail.com",
    phone: "+216 55 495 816",
    hours1: "الإثنين – السبت : 08:30 – 16:30",
    hours2: "الأحد: مغلق",
    whatsapp: "https://wa.me/21612345678",

    // ✅ REAL LINKS
    instagram: "https://www.instagram.com/wahret_zmen_by_sabri/",
    facebook: "https://www.facebook.com/Wahret.zmen.jebbacaftan",
  };

  const infoCards = [
    { Icon: MapPin, title: "زورونا", line1: CONTACT.city, line2: CONTACT.area },
    {
      Icon: Phone,
      title: "اتصل بنا",
      line1: CONTACT.phone,
      line2: "واتساب متاح",
      isPhone: true,
    },
    {
      Icon: Mail,
      title: "راسلنا",
      line1: CONTACT.email2,
      line2: "نرد خلال 24 ساعة",
    },
    {
      Icon: Clock,
      title: "ساعات العمل",
      line1: CONTACT.hours1,
      line2: CONTACT.hours2,
    },
  ];

  return (
    <div id="top" className="wz-contact">
      <FadeInSection>
        <div
          className="wz-contact__wrap px-4 sm:px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto"
          style={{
            paddingTop:
              "calc(var(--header-h, 64px) + env(safe-area-inset-top, 0px) + 8px)",
          }}
        >
          <Helmet>
            <title>اتصل بنا | وهرة زمان</title>
          </Helmet>

          {/* HERO */}
          <section className="wz-contact-hero" aria-label="Contact hero">
            <div className="wz-contact-hero__pattern" aria-hidden="true">
              <svg width="100%" height="100%">
                <defs>
                  <pattern
                    id="wz-contact-geo"
                    x="0"
                    y="0"
                    width="64"
                    height="64"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M32 0L64 32L32 64L0 32Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.6"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="4.2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.6"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#wz-contact-geo)" />
              </svg>
            </div>

            <div className="wz-contact-hero__inner">
              <p className="wz-contact-hero__kicker">تواصل معنا</p>
              <h1
                className="wz-contact-hero__title"
                style={{ scrollMarginTop: "calc(var(--header-h, 64px) + 12px)" }}
              >
                اتصل بنا
              </h1>
              <div className="wz-contact-hero__divider" />
              <p className="wz-contact-hero__subtitle">
                يسعدنا تواصلكم لأي استفسار أو طلب بخصوص منتجات وهرة زمان — فريقنا
                جاهز لمساعدتكم.
              </p>
            </div>
          </section>

          {/* INFO CARDS */}
          <section className="wz-contact-cards" aria-label="Contact info cards">
            <div className="wz-contact-cards__grid">
              {infoCards.map((item, idx) => (
                <div key={idx} className="wz-card">
                  <div className="wz-card__icon">
                    <item.Icon className="wz-icon" />
                  </div>

                  <h3 className="wz-card__title">{item.title}</h3>

                  {item.isPhone ? (
                    <p className="wz-card__text">
                      <span dir="ltr" style={{ unicodeBidi: "bidi-override" }}>
                        {item.line1}
                      </span>
                    </p>
                  ) : (
                    <p className="wz-card__text">{item.line1}</p>
                  )}

                  <p className="wz-card__text">{item.line2}</p>
                </div>
              ))}
            </div>
          </section>

          {/* MAIN GRID */}
          <section className="wz-contact-main" aria-label="Contact form and map">
            <div className="wz-contact-main__grid">
              {/* LEFT: FORM */}
              <div className="wz-contact-main__left">
                <div className="wz-panel">
                  <div className="wz-panel__head">
                    <h2 className="wz-panel__title">أرسل لنا رسالة</h2>
                    <p className="wz-panel__desc">
                      املأ النموذج التالي وسنقوم بالرد عليك في أقرب وقت ممكن.
                    </p>
                  </div>

                  <ContactForm
                    onSuccess={(msg) => {
                      setSuccessMessage(msg);
                      setTimeout(() => setSuccessMessage(null), 6000);
                    }}
                  />

                  {successMessage && (
                    <div className="wz-form-status" role="status">
                      {successMessage}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: SIDEBAR + MAP */}
              <div className="wz-contact-main__right">
                {/* QUICK CHAT */}
                <div className="wz-lux">
                  <div className="wz-lux__pattern" aria-hidden="true">
                    <svg width="100%" height="100%">
                      <defs>
                        <pattern
                          id="wz-sidebar-geo"
                          x="0"
                          y="0"
                          width="44"
                          height="44"
                          patternUnits="userSpaceOnUse"
                        >
                          <circle
                            cx="22"
                            cy="22"
                            r="8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.6"
                          />
                        </pattern>
                      </defs>
                      <rect
                        width="100%"
                        height="100%"
                        fill="url(#wz-sidebar-geo)"
                      />
                    </svg>
                  </div>

                  <div className="wz-lux__content">
                    <h3 className="wz-lux__title">تفضل محادثة سريعة؟</h3>
                    <p className="wz-lux__desc">
                      تواصل معنا مباشرة على واتساب لرد أسرع حول الطلبات، المقاسات،
                      والتفصيل حسب الطلب.
                    </p>

                    <button
                      type="button"
                      className="wz-btn wz-btn--ghost"
                      onClick={() => window.open(CONTACT.whatsapp, "_blank")}
                    >
                      <MessageCircle size={18} />
                      <span>محادثة واتساب</span>
                    </button>
                  </div>
                </div>

                {/* SOCIAL */}
                <div className="wz-panel wz-panel--tight">
                  <h3 className="wz-panel__miniTitle">تابعنا</h3>
                  <p className="wz-panel__miniDesc">
                    كن على اطلاع بآخر المجموعات ولمحات من تفاصيل الحِرفة.
                  </p>

                  <div className="wz-social">
                    <button
                      type="button"
                      className="wz-social__btn"
                      onClick={() => window.open(CONTACT.instagram, "_blank")}
                    >
                      <Instagram size={18} />
                      <span>إنستغرام</span>
                    </button>

                    <button
                      type="button"
                      className="wz-social__btn"
                      onClick={() => window.open(CONTACT.facebook, "_blank")}
                    >
                      <Facebook size={18} />
                      <span>فيسبوك</span>
                    </button>
                  </div>
                </div>

                {/* FAQ */}
                <div className="wz-panel wz-panel--tight">
                  <h3 className="wz-panel__miniTitle">أسئلة شائعة</h3>
                  <ul className="wz-faq">
                    <li>تفصيل حسب المقاس متاح عند الطلب</li>
                    <li>توصيل خلال 3–7 أيام عمل داخل كامل الجمهورية</li>
                    <li>إمكانية الاستبدال خلال 7 أيام من الاستلام</li>
                    <li>الدفع عند الاستلام — بدون دفع مسبق</li>
                  </ul>
                </div>

                {/* MAP */}
                <div className="wz-map">
                  <iframe
                    title="Google Maps"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3194.899436156162!2d10.168883975609846!3d36.79696146788252!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd353026677d91%3A0xf877b7effea31709!2ssabri%20wahret%20zmen!5e0!3m2!1sfr!2stn!4v1741992302530!5m2!1sfr!2stn"
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                </div>

                {/* ADDRESS BLOCK */}
                <div className="wz-panel wz-panel--tight">
                  <h3 className="wz-panel__miniTitle">بيانات التواصل</h3>
                  <div className="wz-contact-lines">
                    <div className="wz-line">
                      <MapPin size={18} />
                      <span>18 سوق الصوف، تونس، 1008</span>
                    </div>
                    <div className="wz-line">
                      <Mail size={18} />
                      <span>{CONTACT.email1}</span>
                    </div>
                    <div className="wz-line">
                      <Mail size={18} />
                      <span>{CONTACT.email2}</span>
                    </div>
                    <div className="wz-line">
                      <Phone size={18} />
                      <span dir="ltr" style={{ unicodeBidi: "bidi-override" }}>
                        {CONTACT.phone}
                      </span>
                    </div>
                    <div className="wz-line">
                      <Clock size={18} />
                      <span>
                        {CONTACT.hours1} — {CONTACT.hours2}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </FadeInSection>
    </div>
  );
};

export default Contact;