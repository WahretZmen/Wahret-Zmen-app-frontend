import React from "react";
import { Helmet } from "react-helmet";

import FadeInSection from "../../Animations/FadeInSection.jsx";
import "../../Styles/StylesHome.css";

import WahretZmenLargeBanner from "../../components/WahretZmenLargeBanner.jsx";
import VideoShowcase from "../../components/VideoShowcase.jsx";
import PremiumBanner from "../../pages/home/PremiumBanner.jsx"
import ShopByCategory from "../../components/ShopByCategory.jsx";
import OurSellers from "./OurSellers";
import News from "./News";
import CraftsmanshipShowcase from "../../components/CraftsmanshipShowcase.jsx";
import AboutWahretZmen from "../../components/AboutWahretZmen.jsx";
import TestimonialsOverview from "../../components/TestimonialsOverview.jsx";

import hommeJebba from "../../assets/Jebbas/Hommes/Jebba-Homme.jpg";
import femmeJebba from "../../assets/Jebbas/Femmes/Jebba-Femme.jpg";
import enfantJebba from "../../assets/Jebbas/Enfants/Jebba-Enfant.jpg";

import FullWidth from "../../components/ui/FullWidth";

const Home = () => {
  const isRTL = true;

  const shopItems = [
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

  return (
    <>
      <Helmet>
        <title>وهرة زمان - الملابس التقليدية وبائعونا</title>
        <meta
          name="description"
          content="مرحبًا بكم في وهرة زمان، استكشفوا مجموعتنا من الملابس التقليدية، والوافدات الجديدة، وآخر صيحات الموضة."
        />
      </Helmet>

      <div className="home-page-lux home-page-fadein">
        {/* HERO */}
        <FadeInSection delay={0} yOffset={0}>
          <section className="home-reveal home-reveal--hero">
            <div className="home-cinema-reveal home-hero-shell">
              <FullWidth dir={isRTL ? "rtl" : "ltr"}>
                <div className="home-hero-frame">
                  <WahretZmenLargeBanner />
                </div>
              </FullWidth>
            </div>
          </section>
        </FadeInSection>

        {/* VIDEO */}
        <FadeInSection delay={0.08}>
          <section className="home-reveal home-reveal--video">
            <div className="home-soft-rise home-video-shell">
              <div className="home-glass-section home-video-glow">
                <VideoShowcase
                  dir={isRTL ? "rtl" : "ltr"}
                  ctaLabel="تسوّق الآن"
                />
              </div>
            </div>
          </section>
        </FadeInSection>

        <div
          className="home-container px-4 sm:px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* SECONDARY BANNER */}
          
            <section className="mb-16 home-reveal home-reveal--banner">
              <div className="home-lux-reveal home-banner-shell">
                <div className="relative home-shimmer-panel">
                  <PremiumBanner />
                </div>

                <span className="home-premium-line anim-shimmer" />
              </div>

              <div className="text-center mt-6">
                <p className="text-lg text-gray-700 max-w-3xl mx-auto px-2 home-soft-blur-up">
                  خطوة نحو التقاليد بأناقة. بوتيك وهرة زمان يقدم لكم مجموعة خالدة
                  من الأزياء التونسية الأصيلة، مصنوعة بشغف وإرث.
                </p>
              </div>
            </section>
          
          {/* SHOP BY CATEGORY */}
          <FadeInSection delay={0.2}>
            <section className="home-reveal home-reveal--categories">
              <div className="home-section-shell home-fade-up-strong">
                <ShopByCategory
                  items={shopItems}
                  title={
                    <span
                      className="t-anim t-tracking t-delay t-underline home-title-fx"
                      style={{ "--t-delay": "100ms" }}
                    >
                      تسوّق حسب الفئة
                    </span>
                  }
                />
              </div>
            </section>
          </FadeInSection>

          {/* OUR SELLERS */}
          <FadeInSection delay={0.26}>
            <section className="home-reveal home-reveal--sellers">
              <div className="home-transparent-section home-our-sellers-block home-lift-fade">
                <div className="text-center px-4 mb-4 home-heading-stack">
                  <h2
                    className="text-3xl font-bold text-[#8A5D3B] drop-shadow-sm t-anim t-tracking t-glow t-delay home-headline-lux"
                    style={{ "--t-delay": "140ms" }}
                  >
                    مجموعاتنا
                  </h2>

                  <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-3 home-soft-blur-up">
                    استكشفوا مجموعتنا من الملابس التقليدية المصنوعة بعناية وأصالة
                    ثقافية. من القفاطين الأنيقة إلى الجباب التقليدية، اكتشفوا جمال
                    التراث في كل قطعة.
                  </p>
                </div>

                <div className="home-panel-glow home-panel-glow--warm">
                  <OurSellers />
                </div>
              </div>
            </section>
          </FadeInSection>

          {/* NEWS */}
          
            <section className="home-reveal home-reveal--news">
              <div className="home-transparent-section home-news-block home-editorial-fade">
                <div className="text-center px-4 mb-2 home-heading-stack">
                  <h2
                    className="text-3xl font-semibold text-[#5C3D2E] t-anim t-tracking t-delay home-headline-lux"
                    style={{ "--t-delay": "160ms" }}
                  >
                    
                  </h2>
                </div>

                <div className="home-news-reveal">
                  <News />
                </div>
              </div>
            </section>
          
          {/* CRAFTSMANSHIP */}
          <FadeInSection delay={0.38}>
            <section className="home-reveal home-reveal--craft">
              <div className="home-deep-reveal">
                <div className="home-craft-shell">
                  <CraftsmanshipShowcase />
                </div>
              </div>
            </section>
          </FadeInSection>

          {/* TESTIMONIALS */}
          <FadeInSection delay={0.44}>
            <section className="home-reveal home-reveal--testimonials">
              <div className="home-prestige-rise">
                <div className="home-testimonials-shell">
                  <TestimonialsOverview />
                </div>
              </div>
            </section>
          </FadeInSection>

          {/* ABOUT */}
          <FadeInSection delay={0.5}>
            <section className="home-reveal home-reveal--about">
              <div className="home-grand-fade">
                <div className="home-about-shell">
                  <AboutWahretZmen />
                </div>
              </div>
            </section>
          </FadeInSection>
        </div>
      </div>
    </>
  );
};

export default Home;