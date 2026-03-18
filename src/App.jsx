// // src/App.jsx
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
  const pathname = location?.pathname || "";

  const isSingleProductPage = /^\/products\/[^/]+$/.test(pathname);

  const [layoutReady, setLayoutReady] = useState(false);
  const [singleProductReady, setSingleProductReady] = useState(!isSingleProductPage);

  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    document.body.setAttribute("dir", "rtl");
    document.body.classList.add("rtl");
    document.body.classList.remove("ltr");

    document.documentElement.style.maxWidth = "100%";
    document.documentElement.style.overflowX = "hidden";
    document.body.style.maxWidth = "100%";
    document.body.style.overflowX = "hidden";
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

    const onReady = () => setSingleProductReady(true);

    window.addEventListener("wz:single-product-ready", onReady);
    return () => window.removeEventListener("wz:single-product-ready", onReady);
  }, [isSingleProductPage]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    setLayoutReady(false);

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);

    const raf = requestAnimationFrame(() => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
      setLayoutReady(true);
    });

    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  useEffect(() => {
    if (!layoutReady) {
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

        <main className={`flex-1 app-main ${layoutReady ? "app-main--ready" : "app-main--hidden"}`}>
          <Outlet />
        </main>

        {canShowFooter ? <Footer key={isSingleProductPage ? "footer-sp" : "footer-default"} /> : null}
      </div>
    </AuthProvider>
  );
}

export default App;