// src/components/ContentShowcase.jsx
import React from "react";
import { Link } from "react-router-dom";

// Animations
import FadeInSection from "../Animations/FadeInSection.jsx";
import ScrollFade from "../Animations/ScrollFade.jsx";

// Assets
import hommeJebba from "../assets/Jebbas/Hommes/Jebba-Homme.jpg";
import femmeJebba from "../assets/Jebbas/Femmes/Jebba-Femme.jpg";
import enfantJebba from "../assets/Jebbas/Enfants/Jebba-Enfant.jpg";

import "../Styles/StylesContentShowcase.css";

// نصوص عربية مباشرة (بدل i18n)
const TEXT = {
  aria: "مجموعات مميزة",
  title: "أناقة خالدة، إرث حيّ",
  subtitle: (
    <>
      اكتشفوا قطعًا راقية صُنعت بشغف و<strong>بخبرة تونسية</strong>.
    </>
  ),

  badges: {
    artisan: "حِرَفِي",
    handmade: "صُنع يدوي",
    new: "جديد",
  },

  hommes: {
    alt: "جبّة رجالية",
    title: "مجموعة الرجال",
    desc: (
      <>
        قصّات نبيلة وأقمشة فاخرة لإطلالة <strong>راقية</strong>. كل تفصيلة تحكي
        حكاية.
      </>
    ),
    btn: "اكتشف الرجال",
    link: "/category/hommes",
  },

  femmes: {
    alt: "جبّة نسائية",
    title: "مجموعة النساء",
    desc: (
      <>
        قصّات رشيقة وتطريزات أنيقة وأناقة <strong>طبيعية</strong> تُميّز كل لحظة.
      </>
    ),
    btn: "اكتشف النساء",
    link: "/category/femmes",
  },

  enfants: {
    alt: "جبّة أطفال",
    title: "مجموعة الأطفال",
    desc: (
      <>
        راحة ونعومة وتقاليد للصغار — <strong>إرث</strong> يُرتدى بفخر.
      </>
    ),
    btn: "اكتشف الأطفال",
    link: "/category/enfants",
  },

  cta: {
    text: "خصّصوا إطلالتكم: ألوان وتطريزات ومقاسات حسب الطلب.",
    btn: "عرض كل المنتجات",
    link: "/products",
  },
};

const ContentShowcase = () => {
  const isRTL = true;

  return (
    <section
      className="content-showcase-wrapper"
      dir={isRTL ? "rtl" : "ltr"}
      aria-label={TEXT.aria}
    >
      {/* Header */}
      <FadeInSection>
        <header className="cs-header">
          <h2 className="cs-title shimmer-title">{TEXT.title}</h2>
          <p className="cs-subtitle">{TEXT.subtitle}</p>
        </header>
      </FadeInSection>

      {/* Card 1 — Hommes */}
      <article className="cs-row">
        <ScrollFade direction="right-to-left" delay={0.1}>
          <div className="cs-image tilt-on-hover">
            <img src={hommeJebba} alt={TEXT.hommes.alt} />
            <span className="cs-image-badge">{TEXT.badges.artisan}</span>
          </div>
        </ScrollFade>

        <ScrollFade direction="left-to-right" delay={0.15}>
          <div className="cs-text">
            <h3 className="cs-heading">{TEXT.hommes.title}</h3>
            <p className="cs-desc">{TEXT.hommes.desc}</p>
            <Link to={TEXT.hommes.link} className="cs-btn">
              {TEXT.hommes.btn}
            </Link>
          </div>
        </ScrollFade>
      </article>

      {/* Card 2 — Femmes */}
      <article className="cs-row cs-row--alt">
        <ScrollFade direction="right-to-left" delay={0.1}>
          <div className="cs-text">
            <h3 className="cs-heading">{TEXT.femmes.title}</h3>
            <p className="cs-desc">{TEXT.femmes.desc}</p>
            <Link to={TEXT.femmes.link} className="cs-btn">
              {TEXT.femmes.btn}
            </Link>
          </div>
        </ScrollFade>

        <ScrollFade direction="left-to-right" delay={0.15}>
          <div className="cs-image tilt-on-hover">
            <img src={femmeJebba} alt={TEXT.femmes.alt} />
            <span className="cs-image-badge">{TEXT.badges.handmade}</span>
          </div>
        </ScrollFade>
      </article>

      {/* Card 3 — Enfants */}
      <article className="cs-row">
        <ScrollFade direction="right-to-left" delay={0.1}>
          <div className="cs-image tilt-on-hover">
            <img src={enfantJebba} alt={TEXT.enfants.alt} />
            <span className="cs-image-badge">{TEXT.badges.new}</span>
          </div>
        </ScrollFade>

        <ScrollFade direction="left-to-right" delay={0.15}>
          <div className="cs-text">
            <h3 className="cs-heading">{TEXT.enfants.title}</h3>
            <p className="cs-desc">{TEXT.enfants.desc}</p>
            <Link to={TEXT.enfants.link} className="cs-btn">
              {TEXT.enfants.btn}
            </Link>
          </div>
        </ScrollFade>
      </article>

      {/* CTA */}
      <FadeInSection>
        <div className="cs-cta">
          <p className="cs-cta-text">{TEXT.cta.text}</p>
          <Link to={TEXT.cta.link} className="cs-cta-btn">
            {TEXT.cta.btn}
          </Link>
        </div>
      </FadeInSection>
    </section>
  );
};

export default ContentShowcase;
