// src/components/AboutLargeBanner.jsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

import aboutBannerImg from "../assets/About/LargeBanner_AboutPage.jpg";
import "../Styles/StylesAboutLargeBanner.css";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const AboutLargeBanner = () => {
  const bannerRef = useRef(null);

  const [isHovered, setIsHovered] = useState(false);
  const [offsetX, setOffsetX] = useState(50);
  const [offsetY, setOffsetY] = useState(34);

  const handleWheel = useCallback(
    (event) => {
      if (!bannerRef.current || !isHovered) return;

      event.preventDefault();

      const horizontalIntent =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey;

      if (horizontalIntent) {
        const moveX = event.shiftKey
          ? event.deltaY * 0.018
          : event.deltaX * 0.018;

        setOffsetX((prev) => clamp(prev + moveX, 18, 82));
        return;
      }

      const moveY = event.deltaY * 0.018;
      setOffsetY((prev) => clamp(prev + moveY, 14, 82));
    },
    [isHovered]
  );

  useEffect(() => {
    const node = bannerRef.current;
    if (!node) return undefined;

    node.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      node.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  return (
    <section
      ref={bannerRef}
      className={`wz-aboutBanner ${isHovered ? "is-hovered" : ""}`}
      aria-label="وهرة زمان - بانر صفحة من نحن"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="wz-aboutBanner__mediaWrap">
        <img
          src={aboutBannerImg}
          alt="وهرة زمان - أزياء تونسية أصيلة بتفاصيل راقية"
          className="wz-aboutBanner__image"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          draggable="false"
          style={{
            objectPosition: `${offsetX}% ${offsetY}%`,
          }}
        />
      </div>

      <div className="wz-aboutBanner__content">
        
          
          
        

        <h2 className="wz-aboutBanner__title">
          حكاية أناقة تنبض من التراث
          <span className="wz-aboutBanner__titleLine" />
        </h2>

        <p className="wz-aboutBanner__text">
          في <strong>وهرة زمان</strong> نعيد تقديم روح اللباس التونسي الأصيل
          بأسلوب معاصر، حيث تلتقي فخامة التفاصيل بجمال القصّات الراقية لنمنحكم
          تجربة تعبّر عن الهوية، الذوق، والحضور المميّز.
        </p>

        <p className="wz-aboutBanner__subtext">
          كل قطعة لدينا تحمل لمسة من الحرفية، ودفئًا من التراث، وأناقة صُمّمت
          لترافقكم في المناسبات واللحظات الجميلة بكل ثقة وفخر.
        </p>

        

        

        
      </div>
    </section>
  );
};

export default AboutLargeBanner;