// src/components/Contact-form.jsx
// -----------------------------------------------------------------------------
// Premium contact form (Arabic RTL content)
// ✅ Plain CSS only (no Tailwind, no shadcn)
// ✅ Same behavior: POST /api/contact using axios + getBaseUrl
// -----------------------------------------------------------------------------

import React, { useMemo, useState } from "react";
import axios from "axios";
import getBaseUrl from "../utils/baseURL.js";
import { Send } from "lucide-react";

const safeText = (v) =>
  typeof v === "string" ? v.trim() : String(v ?? "").trim();

const ContactForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = useMemo(() => getBaseUrl(), []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const name = safeText(formData.name);
    const email = safeText(formData.email);
    const subject = safeText(formData.subject);
    const message = safeText(formData.message);

    if (!name || !email || !subject || !message) {
      return "يرجى ملء الحقول المطلوبة (*) قبل الإرسال.";
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return "يرجى إدخال بريد إلكتروني صالح.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_BASE}/api/contact`, formData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
        timeout: 15000,
      });

      onSuccess?.("تم إرسال رسالتك بنجاح! سنقوم بالرد عليك في أقرب وقت.");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message || err?.response?.data?.error || null;
      setError(
        serverMsg || "حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="wz-form" noValidate>
      <div className="wz-form__grid">
        <div className="wz-field">
          <label className="wz-label">
            الاسم الكامل <span className="wz-req">*</span>
          </label>
          <input
            className="wz-input"
            type="text"
            name="name"
            placeholder="الاسم الكامل"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
            autoComplete="name"
          />
        </div>

        <div className="wz-field">
          <label className="wz-label">
            البريد الإلكتروني <span className="wz-req">*</span>
          </label>
          <input
            className="wz-input"
            type="email"
            name="email"
            placeholder="البريد الإلكتروني"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div className="wz-field">
          <label className="wz-label">رقم الهاتف</label>
          <input
            className="wz-input"
            type="tel"
            name="phone"
            placeholder="+216 XX XXX XXX"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
            autoComplete="tel"
            dir="ltr"
            style={{ unicodeBidi: "bidi-override" }}
          />
        </div>

        <div className="wz-field">
          <label className="wz-label">
            موضوع الرسالة <span className="wz-req">*</span>
          </label>
          <input
            className="wz-input"
            type="text"
            name="subject"
            placeholder="موضوع الرسالة"
            value={formData.subject}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="wz-field">
        <label className="wz-label">
          الرسالة <span className="wz-req">*</span>
        </label>
        <textarea
          className="wz-textarea"
          name="message"
          placeholder="اكتب رسالتك هنا..."
          value={formData.message}
          onChange={handleChange}
          required
          disabled={loading}
          rows={7}
        />
      </div>

      <div className="wz-form__actions">
        <button
          type="submit"
          className="wz-btn wz-btn--primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="wz-spinner" aria-hidden="true" />
              <span>جاري الإرسال...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>إرسال الرسالة</span>
            </>
          )}
        </button>

        <p className="wz-form__hint">
          بالضغط على “إرسال الرسالة” فإنك توافق على أن يتم التواصل معك للرد على
          استفسارك.
        </p>
      </div>

      {error && (
        <div className="wz-alert wz-alert--error" role="alert">
          {error}
        </div>
      )}
    </form>
  );
};

export default ContactForm;