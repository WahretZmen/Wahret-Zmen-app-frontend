// src/pages/AdminLogin.jsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import axios from "axios";
import getBaseUrl from "../utils/baseURL";
import { useNavigate, Link } from "react-router-dom";
import "../Styles/StylesLogin.css";

/**
 * AdminLogin (Arabic only, no i18n)
 * ---------------------------------
 * - Simple admin login form (username/email + password)
 * - Calls backend: POST /api/auth/admin
 * - Stores token in localStorage and auto-expires after 1 hour
 * - SweetAlert messages in Arabic
 */

const safeText = (v) => (typeof v === "string" ? v.trim() : String(v ?? "").trim());

const AdminLogin = () => {
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  /* --------------------------------
   * SweetAlert helpers
   * -------------------------------- */
  const showSuccessAlert = (title, text) => {
    Swal.fire({
      title,
      text,
      icon: "success",
      confirmButtonColor: "#8B5C3E",
      confirmButtonText: "الدخول إلى لوحة التحكم",
      timer: 1800,
      showClass: { popup: "animate__animated animate__fadeInDown" },
      hideClass: { popup: "animate__animated animate__fadeOutUp" },
    });
  };

  const showErrorAlert = (title, text) => {
    Swal.fire({
      title,
      text,
      icon: "error",
      confirmButtonColor: "#d33",
      confirmButtonText: "حاول مرة أخرى",
      showClass: { popup: "animate__animated animate__shakeX" },
      hideClass: { popup: "animate__animated animate__fadeOut" },
    });
  };

  /* --------------------------------
   * Submit handler
   * -------------------------------- */
  const onSubmit = async (data) => {
    try {
      setMessage("");

      const username = safeText(data?.username);
      const password = safeText(data?.password);

      if (!username || !password) {
        const t = "الرجاء إدخال اسم المستخدم وكلمة المرور.";
        setMessage(t);
        showErrorAlert("بيانات ناقصة", t);
        return;
      }

      const baseUrl = String(getBaseUrl() || "").replace(/\/$/, "");
      const url = `${baseUrl}/api/auth/admin`;

      // 🔐 Authenticate admin (send normalized payload)
      const response = await axios.post(
        url,
        { username, password },
        {
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          withCredentials: true,
        }
      );

      const auth = response?.data || {};
      const token = safeText(auth?.token);

      if (!token) {
        const t = "تم تسجيل الدخول ولكن لم يتم استلام رمز المصادقة (token).";
        setMessage(t);
        showErrorAlert("مشكلة في الخادم", t);
        return;
      }

      // 💾 Save token (adminToken) + keep compatibility with old "token"
      localStorage.setItem("adminToken", token);
      localStorage.setItem("token", token);

      // Optional: store expiry timestamp to check later
      const expiresAt = Date.now() + 3600 * 1000;
      localStorage.setItem("adminToken_expiresAt", String(expiresAt));

      // Auto-expire after 1 hour
      setTimeout(() => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminToken_expiresAt");
        // keep removing token too (compatibility)
        localStorage.removeItem("token");

        showErrorAlert("انتهت الجلسة", "انتهت صلاحية جلسة الإدارة، يرجى تسجيل الدخول من جديد.");
        navigate("/admin/login");
      }, 3600 * 1000);

      showSuccessAlert("تم تسجيل الدخول", "تم تسجيل دخولك كمسؤول بنجاح");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      // Try to read backend message
      const backendMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "";

      const status = error?.response?.status;

      let errText = "اسم المستخدم أو كلمة المرور غير صحيحة.";
      if (status === 500) errText = "حدث خطأ في الخادم. تحقق من إعدادات السيرفر.";
      if (status === 400) errText = "الرجاء التحقق من البيانات المدخلة.";
      if (backendMsg && typeof backendMsg === "string") {
        // show backend message if it’s useful
        errText = backendMsg;
      }

      setMessage(errText);
      showErrorAlert("خطأ في تسجيل الدخول", errText);
    }
  };

  return (
    <div className="login-page" dir="rtl" lang="ar">
      <div className="login-card">
        <div className="login-header">
          <h2 className="login-title">تسجيل دخول الإدارة</h2>
          <p className="login-subtitle">هذا القسم مخصص فقط لإدارة متجر وهرة زمان.</p>
        </div>

        {message && (
          <p className="login-error" role="alert">
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              اسم المستخدم أو البريد الإلكتروني
            </label>
            <input
              {...register("username", {
                required: true,
                setValueAs: (v) => safeText(v),
              })}
              type="text"
              id="username"
              placeholder="أدخل اسم المستخدم أو البريد الإلكتروني"
              className="input-field"
              autoComplete="username"
              inputMode="text"
            />
            {errors.username && <p className="error-text">اسم المستخدم مطلوب.</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              كلمة المرور
            </label>
            <input
              {...register("password", {
                required: true,
                setValueAs: (v) => safeText(v),
              })}
              type="password"
              id="password"
              placeholder="أدخل كلمة المرور"
              className="input-field"
              autoComplete="current-password"
            />
            {errors.password && <p className="error-text">كلمة المرور مطلوبة.</p>}
          </div>

          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting ? "جارٍ التحقق..." : "دخول لوحة التحكم"}
          </button>
        </form>

        <p className="login-link">
          العودة إلى المتجر؟{" "}
          <Link to="/" className="link-primary">
            الصفحة الرئيسية
          </Link>
        </p>

        <p className="footer-text">
          ©{new Date().getFullYear()} Wahret Zmen Boutique. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;