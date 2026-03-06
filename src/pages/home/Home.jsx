// src/pages/home/Home.jsx
// Home page (Arabic / RTL)

import React from "react";
import { Helmet } from "react-helmet";

import FadeInSection from "../../Animations/FadeInSection.jsx";
import "../../Styles/StylesHome.css";

import LargeBanner from "../../components/LargeBanner.jsx";
import VideoShowcase from "../../components/VideoShowcase.jsx";
import Banner from "./Banner";
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
          <div className="home-cinema-reveal home-hero-shell">
            <FullWidth dir={isRTL ? "rtl" : "ltr"}>
              <div className="home-hero-frame">
                <LargeBanner />
              </div>
            </FullWidth>
          </div>
        </FadeInSection>

        {/* Video Showcase */}
        <FadeInSection delay={0.1}>
          <div className="home-soft-rise home-delay-1">
            <div className="home-glass-section home-video-shell">
              <VideoShowcase dir={isRTL ? "rtl" : "ltr"} ctaLabel="تسوّق الآن" />
            </div>
          </div>
        </FadeInSection>

        <div
          className="home-container px-4 sm:px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <FadeInSection delay={0.16}>
            <section className="mb-16 home-lux-reveal home-delay-1">
              <div className="relative home-banner-shell">
                <div className="home-shimmer-panel">
                  <Banner />
                </div>
                <span className="block h-[2px] w-1/2 mx-auto mt-6 rounded-full anim-shimmer" />
              </div>

              <div className="text-center mt-6">
                <p className="text-lg text-gray-700 max-w-3xl mx-auto px-2 home-soft-blur-up home-delay-2">
                  خطوة نحو التقاليد بأناقة. بوتيك وهرة زمان يقدم لكم مجموعة خالدة
                  من الأزياء التونسية الأصيلة، مصنوعة بشغف وإرث.
                </p>
              </div>
            </section>
          </FadeInSection>

          <FadeInSection delay={0.22}>
            <section className="home-section-shell home-fade-up-strong home-delay-1">
              <ShopByCategory
                items={shopItems}
                title={
                  <span className="t-anim t-tracking t-delay t-underline home-title-fx" style={{ "--t-delay": "100ms" }}>
                    تسوّق حسب الفئة
                  </span>
                }
              />
            </section>
          </FadeInSection>

          {/* Collections / Our Sellers */}
          <FadeInSection delay={0.28}>
            <section className="home-transparent-section home-our-sellers-block home-lift-fade home-delay-1">
              <div className="text-center px-4 mb-4">
                <h2
                  className="text-3xl font-bold text-[#8A5D3B] drop-shadow-sm t-anim t-tracking t-glow t-delay home-headline-lux"
                  style={{ "--t-delay": "140ms" }}
                >
                  مجموعاتنا
                </h2>

                <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-3 home-soft-blur-up home-delay-2">
                  استكشفوا مجموعتنا من الملابس التقليدية المصنوعة بعناية وأصالة
                  ثقافية. من القفاطين الأنيقة إلى الجباب التقليدية، اكتشفوا جمال
                  التراث في كل قطعة.
                </p>
              </div>

              <div className="home-panel-glow home-delay-3">
                <OurSellers />
              </div>
            </section>
          </FadeInSection>

          {/* News */}
          <FadeInSection delay={0.34}>
            <section className="home-transparent-section home-news-block home-lift-fade home-delay-1">
              <div className="text-center px-4 mb-2">
                <h2
                  className="text-3xl font-semibold text-[#5C3D2E] t-anim t-tracking t-delay home-headline-lux"
                  style={{ "--t-delay": "160ms" }}
                >
                  <span className="t-underline t-delay" style={{ "--t-delay": "220ms" }}>
                    آخر الأخبار والاتجاهات
                  </span>
                </h2>
              </div>

              <div className="home-news-reveal home-delay-2">
                <News />
              </div>
            </section>
          </FadeInSection>

          <FadeInSection delay={0.38}>
            <div className="home-fade-up-strong home-delay-1">
              <div className="home-craft-shell">
                <CraftsmanshipShowcase />
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={0.42}>
            <div className="home-soft-rise home-delay-1">
              <div className="home-testimonials-shell">
                <TestimonialsOverview />
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={0.46}>
            <div className="home-grand-fade home-delay-1">
              <div className="home-about-shell">
                <AboutWahretZmen />
              </div>
            </div>
          </FadeInSection>
        </div>
      </div>
    </>
  );
};

export default Home;