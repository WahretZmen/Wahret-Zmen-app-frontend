import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import banner1 from "../../assets/Home/Banner/Banner1.avif";
import banner2 from "../../assets/Home/Banner/Banner2.avif";
import banner3 from "../../assets/Home/Banner/Banner3.avif";

import "../../Styles/StylesPremiumBanner.css";

const AUTOPLAY_MS = 5000;

const PremiumBanner = () => {
  const slides = useMemo(
    () => [
      {
        id: 1,
        image: banner1,
        title: "أصالة تونسية بتفاصيل راقية",
        description:
          "اكتشفوا تشكيلة وهرة زمان من الأزياء التقليدية الراقية، المصممة بعناية لتجسد سحر التراث التونسي وأناقة الحاضر.",
        ctaLabel: "اكتشف الآن",
        ctaTo: "/products",
      },
      {
        id: 2,
        image: banner2,
        title: "قطع مختارة بروحٍ خالدة",
        description:
          "من الجبب التونسية إلى الأزياء التراثية الفاخرة، نقدّم لكم قطعًا تعبّر عن الذوق الرفيع والأصالة.",
        ctaLabel: "اكتشف الآن",
        ctaTo: "/products",
      },
      {
        id: 3,
        image: banner3,
        title: "أناقة الموروث في كل إطلالة",
        description:
          "تصاميم تقليدية بلمسة فاخرة، تمنحكم حضورًا استثنائيًا وتُبرز جمال الحرفة التونسية الأصيلة.",
        ctaLabel: "اكتشف الآن",
        ctaTo: "/products",
      },
    ],
    []
  );

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  const bannerRef = useRef(null);
  const progressRef = useRef(null);
  const timerRef = useRef(null);

  const total = slides.length;

  const goTo = (nextIndex) => {
    setIndex((nextIndex + total) % total);
  };

  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  useEffect(() => {
    const node = bannerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
          observer.unobserve(node);
        }
      },
      {
        threshold: 0.28,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasEntered || paused || total <= 1) return;

    timerRef.current = setTimeout(() => {
      next();
    }, AUTOPLAY_MS);

    if (progressRef.current) {
      progressRef.current.style.transition = "none";
      progressRef.current.style.width = "0%";

      requestAnimationFrame(() => {
        if (!progressRef.current) return;
        progressRef.current.style.transition = `width ${AUTOPLAY_MS}ms linear`;
        progressRef.current.style.width = "100%";
      });
    }

    return () => {
      clearTimeout(timerRef.current);
      if (progressRef.current) {
        progressRef.current.style.transition = "none";
        progressRef.current.style.width = "0%";
      }
    };
  }, [index, paused, total, hasEntered]);

  return (
    <section
      ref={bannerRef}
      className={`banner-container-enhanced wz-carousel ${
        hasEntered ? "is-inview" : "is-hidden-before-view"
      }`}
      dir="rtl"
      aria-label="وهرة زمان بانر"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="wz-progress" aria-hidden="true">
        <span ref={progressRef} className="wz-progress__bar" />
      </div>

      <div className="wz-track">
        {slides.map((slide, i) => {
          const isActive = i === index;
          const shouldAnimate = hasEntered && isActive;

          return (
            <article
              key={slide.id}
              className={`wz-slide ${isActive ? "is-active" : ""}`}
              aria-hidden={!isActive}
            >
              <div className="wz-slide__inner">
                <div
                  className={`banner-image-wrapper ${
                    shouldAnimate ? "is-active" : ""
                  }`}
                >
                  <div className="wz-media">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className={`banner-img ${
                        shouldAnimate ? "banner-img-enter" : ""
                      }`}
                      loading={i === 0 ? "eager" : "lazy"}
                    />
                  </div>
                </div>

                <div
                  className={`banner-text-wrapper ${
                    shouldAnimate ? "is-active" : ""
                  }`}
                >
                  <h2 className="banner-title wz-royal-title">{slide.title}</h2>

                  <p className="banner-description">{slide.description}</p>

                  <Link
                    to={slide.ctaTo}
                    reloadDocument
                    className="link-wrapper"
                  >
                    <button type="button" className="btn-premium">
                      <span className="btn-premium__text">
                        {slide.ctaLabel}
                      </span>
                    </button>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {total > 1 && (
        <>
          <div className="wz-controls" aria-hidden="false">
            <button
              type="button"
              className="wz-arrow wz-arrow--prev"
              onClick={prev}
              aria-label="السابق"
            >
              <span />
            </button>

            <button
              type="button"
              className="wz-arrow wz-arrow--next"
              onClick={next}
              aria-label="التالي"
            >
              <span />
            </button>
          </div>

          <div className="wz-dots" role="tablist" aria-label="شرائح البانر">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                className={`wz-dot ${i === index ? "is-active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`الانتقال إلى الشريحة ${i + 1}`}
                aria-selected={i === index}
                role="tab"
              >
                <span className="wz-dot__ring" />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default PremiumBanner;