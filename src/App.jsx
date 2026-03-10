// src/App.jsx
// App layout (Arabic / RTL) + providers

import { useEffect, useLayoutEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import "./index.css";
import "./App.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Loading from "./components/Loading";
import { AuthProvider } from "./context/AuthContext";

function App() {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [layoutReady, setLayoutReady] = useState(false);

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
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

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
    const shouldLock = loading || !layoutReady;

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
  }, [loading, layoutReady]);

  return (
    <AuthProvider>
      {loading ? (
        <Loading />
      ) : (
        <div className="app-shell min-h-screen flex flex-col bg-[rgb(var(--background))] text-[rgb(var(--foreground))]">
          <Navbar />

          <main
            className={`flex-1 app-main ${
              layoutReady ? "app-main--ready" : "app-main--hidden"
            }`}
          >
            <Outlet />
          </main>

          {layoutReady ? (
            <Footer key={isSingleProductPage ? "footer-sp" : "footer-default"} />
          ) : null}
        </div>
      )}
    </AuthProvider>
  );
}

export default App;