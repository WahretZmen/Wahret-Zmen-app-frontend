// src/components/VideoShowcase.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause } from "lucide-react";
import "../Styles/StylesVideoShowcase.css";

import centerVideo from "../assets/Home/Videos/acaae437-9d58-4d96-88b9-cd48e2874447.mp4";
import leftVideo from "../assets/Home/Videos/fcc0b812-4596-419e-9329-74f84ec402c1.mp4";
import rightVideo from "../assets/Home/Videos/3f994224-25b8-4faf-9f22-c463b10ff31d.mp4";

export default function VideoShowcase({
  dir = "rtl",
  brand = "وهرة زمان",
  kicker = "الحِرفة",
  headline = "تصاميم تونسية… بروحٍ خالدة",
  subtitle = "قطع مختارة بعناية، أقمشة راقية، وتفاصيل تعكس أناقة التراث بلمسة عصرية.",
  ctaLabel = "اكتشف المجموعة",
  ctaTo = "/products",
}) {
  const leftRef = useRef(null);
  const centerRef = useRef(null);
  const rightRef = useRef(null);

  const vids = useMemo(() => [leftRef, centerRef, rightRef], []);

  const [isPlayingAll, setIsPlayingAll] = useState(false);

  useEffect(() => {
    vids.forEach((r) => {
      const v = r.current;
      if (!v) return;
      v.muted = true;
      v.playsInline = true;
      v.loop = true;
      v.preload = "metadata";
      v.setAttribute("playsinline", "");
      v.setAttribute("muted", "");
      v.setAttribute("webkit-playsinline", "");
    });
  }, [vids]);

  const safePlay = async (v) => {
    try {
      const p = v.play?.();
      if (p && typeof p.then === "function") await p;
      return true;
    } catch {
      return false;
    }
  };

  const playAll = async () => {
    vids.forEach((r) => {
      const v = r.current;
      if (!v) return;
      try {
        v.currentTime = 0;
      } catch {}
    });

    const results = await Promise.all(
      vids.map(async (r) => (r.current ? safePlay(r.current) : false))
    );

    if (results.some(Boolean)) setIsPlayingAll(true);
  };

  const pauseAll = () => {
    vids.forEach((r) => {
      const v = r.current;
      if (!v) return;
      try {
        v.pause();
      } catch {}
    });
    setIsPlayingAll(false);
  };

  const togglePlayAll = async () => {
    if (isPlayingAll) pauseAll();
    else await playAll();
  };

  return (
    <section className="vz3-section" dir={dir}>
      <div className="vz3-container">
        <header className="vz3-header">
          <p className="vz3-kickerLine">
            <span className="vz3-kicker">{kicker}</span>
            <span className="vz3-brandDot" aria-hidden="true">
              •
            </span>
            <span className="vz3-brand">{brand}</span>
          </p>

          <h2 className="vz3-title">{headline}</h2>
          <p className="vz3-desc">{subtitle}</p>
        </header>

        <div className="vz3-card">
          <div className="vz3-frame">
            <div className="vz3-lanes">
              {/* LEFT */}
              <div className="vz3-lane vz3-lane--side vz3-lane--left">
                <div className="vz3-videoShell">
                  <video
                    ref={leftRef}
                    className="vz3-video"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  >
                    <source src={leftVideo} type="video/mp4" />
                  </video>
                  <div className="vz3-sideOverlay" />
                </div>
              </div>

              {/* CENTER */}
              <div className="vz3-lane vz3-lane--center">
                <div className="vz3-videoShell">
                  <video
                    ref={centerRef}
                    className="vz3-video"
                    muted
                    loop
                    playsInline
                    preload="auto"
                  >
                    <source src={centerVideo} type="video/mp4" />
                  </video>

                  <div className="vz3-centerOverlay" />

                  <div className="vz3-controlsWrap">
                    <div className="vz3-fabRow">
                      <button
                        type="button"
                        onClick={togglePlayAll}
                        className="vz3-fab"
                        aria-label={isPlayingAll ? "Pause videos" : "Play videos"}
                        title={isPlayingAll ? "Pause" : "Play"}
                      >
                        {isPlayingAll ? (
                          <Pause className="vz3-fabIcon" />
                        ) : (
                          <Play
                            className="vz3-fabIcon vz3-fabIcon--play"
                            fill="currentColor"
                          />
                        )}
                      </button>
                    </div>

                    <div className="vz3-ctaRow">
                      <Link to={ctaTo} className="vz3-cta vz3-cta--premium">
                        <span className="vz3-ctaText">{ctaLabel}</span>
                        <span className="vz3-ctaArrow" aria-hidden="true">
                          ‹
                        </span>
                        <span className="vz3-ctaShine" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="vz3-lane vz3-lane--side vz3-lane--right">
                <div className="vz3-videoShell">
                  <video
                    ref={rightRef}
                    className="vz3-video"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  >
                    <source src={rightVideo} type="video/mp4" />
                  </video>
                  <div className="vz3-sideOverlay" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}