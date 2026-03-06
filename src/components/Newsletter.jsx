// src/components/Newsletter.jsx
// ============================================================================
// Wahret Zmen — Premium Newsletter (AR) — EXACT capture style (JSX + Plain CSS)
// - Same brown luxury bg + subtle plus pattern
// - Same pill input + pill white button
// - RTL section, but form row forced LTR to match capture layout
// - Fully responsive
// ============================================================================

import React, { useEffect, useRef, useState } from "react";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";
import "../Styles/StylesNewsletter.css";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    const value = String(email || "").trim();
    if (!value) return;

    setSubscribed(true);
    setEmail("");

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <section className="wz-newsletter" dir="rtl" aria-label="النشرة البريدية">
      {/* Background */}
      <div className="wz-newsletter__bg" aria-hidden="true" />
      <div className="wz-newsletter__pattern" aria-hidden="true" />

      {/* Decorative lines */}
      <div className="wz-newsletter__line wz-newsletter__line--top" aria-hidden="true" />
      <div
        className="wz-newsletter__line wz-newsletter__line--bottom"
        aria-hidden="true"
      />

      <div className="wz-newsletter__container">
        <div className="wz-newsletter__wrap">
          {/* Icon */}
          <div className="wz-newsletter__icon" aria-hidden="true">
            <Mail className="wz-newsletter__iconSvg" />
          </div>

          {/* Title */}
          <h3 className="wz-newsletter__title">ابقَ على تواصل</h3>

          <p className="wz-newsletter__subtitle">
            كن أول من يكتشف أحدث المجموعات والتصاميم الحصرية المستوحاة من التراث.
          </p>

          {/* Form */}
          <form onSubmit={handleSubscribe} className="wz-newsletter__form">
            {subscribed ? (
              <div className="wz-newsletter__success" role="status" aria-live="polite">
                <CheckCircle className="wz-newsletter__successIcon" />
                <span className="wz-newsletter__successText">شكرًا لاشتراكك</span>
              </div>
            ) : (
              <div className="wz-newsletter__row" dir="ltr">
                <label className="sr-only" htmlFor="wz-nl-email">
                  البريد الإلكتروني
                </label>

                <input
                  id="wz-nl-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="wz-newsletter__input"
                  dir="ltr"
                />

                <button type="submit" className="wz-newsletter__btn">
                  <span className="wz-newsletter__btnText">اشترك</span>
                  <span className="wz-newsletter__btnIconWrap" aria-hidden="true">
                    <ArrowRight className="wz-newsletter__btnIcon" />
                  </span>
                </button>
              </div>
            )}
          </form>

          {/* Trust line */}
          <p className="wz-newsletter__trust">انضم إلى عشّاق التراث</p>
        </div>
      </div>
    </section>
  );
}