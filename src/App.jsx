// src/App.jsx
// App layout (Arabic / RTL) + providers

import { useEffect, useLayoutEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import "./index.css";
import "./App.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";

function App() {
  const location = useLocation();

  const [layoutReady, setLayoutReady] = useState(false);
  const [singleProductReady, setSingleProductReady] = useState(true);

  const pathname = location?.pathname || "";
  const isSingleProductPage = /^\/products\/[^/]+$/.test(pathname);

  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    document.body.setAttribute("dir", "rtl");
    document.body.classList.add("rtl");
    document.body.classList.remove("ltr");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    setSingleProductReady(!isSingleProductPage);
  }, [isSingleProductPage, pathname]);

  useEffect(() => {
    if (!isSingleProductPage) return;

    const onSingleProductReady = () => {
      setSingleProductReady(true);
    };

    window.addEventListener("wz:single-product-ready", onSingleProductReady);
    return () => {
      window.removeEventListener("wz:single-product-ready", onSingleProductReady);
    };
  }, [isSingleProductPage]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    setLayoutReady(false);

    const html = document.documentElement;
    const body = document.body;

    const forceTop = () => {
      html.scrollTop = 0;
      body.scrollTop = 0;
      window.scrollTo(0, 0);
    };

    forceTop();

    let raf1 = 0;
    let raf2 = 0;
    let raf3 = 0;

    raf1 = requestAnimationFrame(() => {
      forceTop();

      raf2 = requestAnimationFrame(() => {
        forceTop();

        raf3 = requestAnimationFrame(() => {
          forceTop();
          setLayoutReady(true);
        });
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      cancelAnimationFrame(raf3);
    };
  }, [pathname]);

  useEffect(() => {
    const shouldLock = !layoutReady;

    if (shouldLock) {
      document.documentElement.classList.add("app-scroll-lock");
      document.body.classList.add("app-scroll-lock");
    } else {
      document.documentElement.classList.remove("app-scroll-lock");
      document.body.classList.remove("app-scroll-lock");
    }

    return () => {
      document.documentElement.classList.remove("app-scroll-lock");
      document.body.classList.remove("app-scroll-lock");
    };
  }, [layoutReady]);

  const canShowFooter = layoutReady && (!isSingleProductPage || singleProductReady);

  return (
    <AuthProvider>
      <div className="app-shell min-h-screen flex flex-col bg-[rgb(var(--background))] text-[rgb(var(--foreground))]">
        <Navbar />

        <main
          className={`flex-1 app-main ${
            layoutReady ? "app-main--ready" : "app-main--hidden"
          }`}
        >
          <Outlet />
        </main>

        {canShowFooter ? (
          <Footer key={isSingleProductPage ? "footer-sp" : "footer-default"} />
        ) : null}
      </div>
    </AuthProvider>
  );
}

export default App;