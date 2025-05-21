import React from "react";
import "../Styles/StylesLargeBanner.css";
import { Trans, useTranslation } from "react-i18next";
import bannerImg from "../assets/Banner/LargeBanner.png"; // lowercase extension


const LargeBanner = () => {
const { t, i18n } = useTranslation();
const isRTL = i18n.language === "ar" || i18n.language === "ar-SA";
if (!i18n.isInitialized) return null;

  return (
    <section className="wahretzmen-banner">
      <img
        src={bannerImg}
        alt="À propos de Wahret Zmen"
        className="wahretzmen-banner-img"
      />
      <div className="wahretzmen-banner-title-wrapper">
  {/* Left-aligned name */}
  <div className="wahretzmen-brand-name">Wahret Zmen</div>

  {/* Centered welcome text */}
  <div className="wahretzmen-banner-title">
    <h1 className="wahretzmen-welcome-animated">{t("Welcome_Banner_title")}</h1>
  </div>
</div>

    </section>
  );
};

export default LargeBanner;
