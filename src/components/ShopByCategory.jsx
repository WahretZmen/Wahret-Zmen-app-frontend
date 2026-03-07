// src/components/ShopByCategory.jsx
// Shop by category (Arabic / RTL)

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../Styles/ShopByCategory.css";

import hommeJebba from "../assets/Jebbas/Hommes/Jebba-Homme.jpg";
import femmeJebba from "../assets/Jebbas/Femmes/Jebba-Femme.jpg";
import enfantJebba from "../assets/Jebbas/Enfants/Jebba-Enfant.jpg";

const DEFAULT_ITEMS = [
  {
    key: "hommes",
    label: "رجال",
    image: hommeJebba,
    to: "/products?category=hommes",
  },
  {
    key: "femmes",
    label: "نساء",
    image: femmeJebba,
    to: "/products?category=femmes",
  },
  {
    key: "enfants",
    label: "أطفال",
    image: enfantJebba,
    to: "/products?category=enfants",
  },
];

const getLabel = (label) => {
  if (!label) return "";
  if (typeof label === "string") return label;
  if (typeof label === "object") return label.ar || label.fr || "";
  return String(label);
};

const getDirectionClass = (itemKey) => {
  switch (itemKey) {
    case "hommes":
      return "cat-card--from-right";
    case "femmes":
      return "cat-card--from-bottom";
    case "enfants":
      return "cat-card--from-left";
    default:
      return "cat-card--from-bottom";
  }
};

const ShopByCategory = ({
  items = DEFAULT_ITEMS,
  title = "تسوّق حسب الفئة",
}) => {
  const isRTL = true;
  const overline = "المجموعة";
  const cta = "اكتشف";

  const sectionRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(node);
        }
      },
      {
        threshold: 0.22,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`shopcat-section ${isInView ? "is-inview" : ""}`}
      aria-label="تسوّق حسب الفئة"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="shopcat-head">
        <h2 className="shopcat-title">{title}</h2>
      </div>

      <div className="shopcat-grid">
        {items.map((it, idx) => {
          const titleText = getLabel(it.label);
          const directionClass = getDirectionClass(it.key);

          return (
            <Link
              key={it.key || idx}
              to={it.to}
              reloadDocument
              className={`cat-card ${directionClass}`}
              style={{ "--i": idx }}
              aria-label={`${overline} – ${titleText}`}
            >
              <div className="cat-media">
                <img
                  src={it.image}
                  alt={titleText}
                  loading="lazy"
                  decoding="async"
                  onDragStart={(e) => e.preventDefault()}
                />

                <span className="cat-media-shine" aria-hidden="true" />
                <span className="cat-media-glow" aria-hidden="true" />
              </div>

              <div className="cat-overlay">
                <span className="cat-overline">{overline}</span>
                <h3 className="cat-title">{titleText}</h3>
                <span className="cat-cta">{cta}</span>
                <span className="cat-underline" aria-hidden="true" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default ShopByCategory;