// src/pages/dashboard/products/UpdateProduct.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import imageCompression from "browser-image-compression";

import getBaseUrl from "../../../utils/baseURL";
import { useGetProductByIdQuery, useUpdateProductMutation } from "../../../redux/features/products/productsApi";

import "../../../Styles/StylesAddProduct.css";

const ALL_SIZES = ["S", "M", "L", "XL"];

const SUBCATEGORY_OPTIONS = [
  { value: "", labelAr: "— بدون —" },
  { value: "accessories", labelAr: "إكسسوارات" },
  { value: "costume", labelAr: "بدلة" },
  { value: "vest", labelAr: "صدريّة" },
  { value: "mens_abaya", labelAr: "عباية رجالي" },
  { value: "jebba", labelAr: "جبّة" },
];

const pickText = (v) => {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object") return String(v.ar || v.fr || v.en || "").trim();
  return "";
};

const UpdateProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: product, isLoading, isError } = useGetProductByIdQuery(id);
  const [updateProduct, { isLoading: saving }] = useUpdateProductMutation();

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      rating: 0,
      sizes: [],
      productId: "",
      description: "",
      category: "",
      subCategory: "",
      embroideryCategory: "",
      oldPrice: "",
      newPrice: "",
      trending: false,

      coupe: "",
      matiere: "",
      composition: "",
      madeIn: "",
      isHandmade: false,
    },
  });

  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverPreviewURL, setCoverPreviewURL] = useState("");
  const [colorInputs, setColorInputs] = useState([]);

  const sizes = watch("sizes") || [];
  const sizeSet = useMemo(() => new Set(sizes), [sizes]);

  const toggleSize = (sz) => {
    const next = new Set(sizeSet);
    if (next.has(sz)) next.delete(sz);
    else next.add(sz);
    setValue("sizes", Array.from(next));
  };

  const toLangObject = (value) => {
    const txt = String(value || "").trim();
    return { ar: txt, fr: txt, en: txt };
  };

  const parseOptionalNumber = (v) => {
    const s = String(v ?? "").trim();
    if (!s) return null;
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, n);
  };

  const compressImage = async (file) =>
    imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true });

  const uploadImage = async (file) => {
    if (!file) return "";
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("image", compressed);

      const res = await axios.post(`${getBaseUrl()}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return res.data.image || "";
    } catch (err) {
      console.error("❌ Image upload failed:", err);
      Swal.fire({ icon: "error", title: "خطأ!", text: "فشل رفع الصورة. يرجى المحاولة مرة أخرى.", confirmButtonText: "حسناً" });
      return "";
    }
  };

  const fullUrl = (url) => (url?.startsWith("http") ? url : `${getBaseUrl()}${url || ""}`);

  const openInNewTab = (url) => {
    const final = url?.startsWith("blob:") ? url : url?.startsWith("http") ? url : `${getBaseUrl()}${url || ""}`;
    if (!final) return;
    window.open(final, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (!product) return;

    reset({
      productId: String(product.productId || "").trim(),

      description: product.description || "",
      category: product.category || "",           // ✅ now matches select values
      subCategory: product.subCategory || "",     // ✅ now saved + matches select

      embroideryCategory: pickText(product.embroideryCategory),

      oldPrice: product.oldPrice === null || product.oldPrice === undefined ? "" : Number(product.oldPrice),
      newPrice: product.newPrice === null || product.newPrice === undefined ? "" : Number(product.newPrice),

      rating: Number(product.rating ?? 0),
      trending: !!product.trending,
      sizes: Array.isArray(product.sizes) ? product.sizes : [],

      coupe: pickText(product.coupe),
      matiere: pickText(product.matiere),
      composition: pickText(product.composition),
      madeIn: pickText(product.madeIn),
      isHandmade: !!product.isHandmade,
    });

    setCoverImageFile(null);
    setCoverPreviewURL(product.coverImage ? fullUrl(product.coverImage) : "");

    const normalized = (product.colors || []).map((c) => {
      const name = pickText(c.colorName) || "";
      const images = Array.isArray(c.images) && c.images.length ? c.images : c.image ? [c.image] : [];
      return {
        _id: c._id,
        colorName: name,
        stock: Number(c.stock ?? 0),
        images,
        pendingFile: null,
        pendingPreview: "",
        uploading: false,
      };
    });

    setColorInputs(normalized.length ? normalized : []);
  }, [product, reset]);

  const handleCoverImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (coverPreviewURL?.startsWith("blob:")) URL.revokeObjectURL(coverPreviewURL);
      setCoverImageFile(file);
      setCoverPreviewURL(URL.createObjectURL(file));
    } else {
      setCoverImageFile(null);
    }
  };

  const setColorAt = (index, patch) =>
    setColorInputs((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  const addColorInput = () =>
    setColorInputs((prev) => [
      ...prev,
      { _id: undefined, colorName: "", stock: 0, images: [], pendingFile: null, pendingPreview: "", uploading: false },
    ]);

  const deleteColorInput = (index) => {
    setColorInputs((prev) => {
      const target = prev[index];
      if (target?.pendingPreview?.startsWith("blob:")) URL.revokeObjectURL(target.pendingPreview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handlePickColorFile = (index, file) => {
    if (file && file.type.startsWith("image/")) {
      setColorInputs((prev) =>
        prev.map((c, i) => {
          if (i !== index) return c;
          if (c.pendingPreview?.startsWith("blob:")) URL.revokeObjectURL(c.pendingPreview);
          return { ...c, pendingFile: file, pendingPreview: URL.createObjectURL(file) };
        })
      );
    }
  };

  const cancelPendingColorFile = (index) =>
    setColorInputs((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        if (c.pendingPreview?.startsWith("blob:")) URL.revokeObjectURL(c.pendingPreview);
        return { ...c, pendingFile: null, pendingPreview: "" };
      })
    );

  const uploadPendingColorFile = async (index) => {
    const color = colorInputs[index];
    if (!color?.pendingFile) return;

    try {
      setColorAt(index, { uploading: true });
      const url = await uploadImage(color.pendingFile);

      if (url) {
        setColorInputs((prev) =>
          prev.map((c, i) => {
            if (i !== index) return c;
            if (c.pendingPreview?.startsWith("blob:")) URL.revokeObjectURL(c.pendingPreview);
            return { ...c, images: [...c.images, url], pendingFile: null, pendingPreview: "", uploading: false };
          })
        );
      } else {
        setColorAt(index, { uploading: false });
      }
    } catch {
      setColorAt(index, { uploading: false });
    }
  };

  const removeColorImage = (cIdx, imgIdx) => {
    Swal.fire({
      title: "حذف الصورة؟",
      text: "سيتم إزالة هذه الصورة من هذا اللون.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "إلغاء",
    }).then((res) => {
      if (!res.isConfirmed) return;
      setColorInputs((prev) =>
        prev.map((c, i) => (i === cIdx ? { ...c, images: c.images.filter((_, j) => j !== imgIdx) } : c))
      );
    });
  };

  const onSubmit = async (data) => {
    try {
      const pid = String(data.productId || "").trim();
      if (!pid) {
        Swal.fire({ icon: "warning", title: "بيانات ناقصة!", text: "يرجى إدخال معرّف المنتج.", confirmButtonText: "حسناً" });
        return;
      }

      // ✅ category keys exactly like DB/controller
      const allowedCategories = ["men", "women", "children"];
      const finalCategory = allowedCategories.includes(data.category) ? data.category : "";

      if (!finalCategory) {
        Swal.fire({ icon: "warning", title: "بيانات ناقصة!", text: "يرجى اختيار الفئة.", confirmButtonText: "حسناً" });
        return;
      }

      const allowedSubKeys = SUBCATEGORY_OPTIONS.map((x) => x.value);
      const finalSubCategory = allowedSubKeys.includes(data.subCategory) ? data.subCategory : "";

      const preparedColors = colorInputs
        .map((c) => ({
          ...c,
          colorName: (c.colorName || "").trim(),
          stock: Number(c.stock) || 0,
          images: Array.isArray(c.images) ? c.images.filter(Boolean) : [],
        }))
        .filter((c) => c.images.length > 0 || c.pendingFile);

      for (let i = 0; i < preparedColors.length; i++) {
        const c = preparedColors[i];
        if (c.pendingFile) {
          const url = await uploadImage(c.pendingFile);
          if (url) {
            c.images.push(url);
            if (c.pendingPreview?.startsWith("blob:")) URL.revokeObjectURL(c.pendingPreview);
            c.pendingFile = null;
            c.pendingPreview = "";
          }
        }
      }

      if (preparedColors.length === 0) {
        Swal.fire({ icon: "warning", title: "بيانات ناقصة!", text: "أضِف لونًا واحدًا على الأقل مع صورة.", confirmButtonText: "حسناً" });
        return;
      }
      if (preparedColors.some((c) => !Array.isArray(c.images) || c.images.length === 0)) {
        Swal.fire({ icon: "warning", title: "صورة مفقودة!", text: "كل لون يجب أن يحتوي على صورة واحدة على الأقل.", confirmButtonText: "حسناً" });
        return;
      }

      let coverImage = product?.coverImage || "";
      if (coverImageFile) {
        const uploaded = await uploadImage(coverImageFile);
        if (uploaded) coverImage = uploaded;
      }

      if (!coverImage) coverImage = preparedColors[0]?.images?.[0] || "";
      if (!coverImage) {
        Swal.fire({ icon: "warning", title: "الصورة الرئيسية!", text: "يرجى تحديد صورة رئيسية.", confirmButtonText: "حسناً" });
        return;
      }

      const colorsForServer = preparedColors.map((c) => ({
        ...(c._id ? { _id: c._id } : {}),
        colorName: toLangObject(c.colorName),
        images: c.images,
        image: c.images?.[0],
        stock: Number(c.stock) || 0,
      }));

      const oldPrice = parseOptionalNumber(data.oldPrice);
      const newPrice = parseOptionalNumber(data.newPrice);

      const payload = {
        id,
        productId: pid,

        description: (data.description || "").trim(),
        category: finalCategory,
        subCategory: finalSubCategory,

        embroideryCategory: (data.embroideryCategory || "").trim(),

        coupe: (data.coupe || "").trim(),
        matiere: (data.matiere || "").trim(),
        composition: (data.composition || "").trim(),
        madeIn: (data.madeIn || "").trim(),
        isHandmade: !!data.isHandmade,

        coverImage,
        colors: colorsForServer,

        oldPrice,
        newPrice,

        stockQuantity: colorsForServer.reduce((sum, c) => sum + (c.stock || 0), 0),
        trending: !!data.trending,
        rating: Math.max(0, Math.min(5, Number(data.rating ?? 0))),
        sizes: Array.isArray(data.sizes) ? data.sizes : [],
      };

      await updateProduct(payload).unwrap();

      Swal.fire({ icon: "success", title: "تم تحديث المنتج بنجاح!", confirmButtonText: "حسناً" });
      navigate("/dashboard/manage-products");
    } catch (error) {
      console.error("❌ Error updating product:", error?.data || error);
      Swal.fire({ icon: "error", title: "خطأ!", text: error?.data?.message || "فشل في تحديث المنتج.", confirmButtonText: "حسناً" });
    }
  };

  if (isLoading) {
    return (
      <div className="wz-ap" dir="rtl">
        <div className="wz-ap__card">جارٍ التحميل...</div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="wz-ap" dir="rtl">
        <div className="wz-ap__card" style={{ color: "#dc2626", fontWeight: 900 }}>
          تعذّر تحميل المنتج.
        </div>
      </div>
    );
  }

  return (
    <div className="wz-ap" dir="rtl">
      <div className="wz-ap__card">
        <h2 className="wz-ap__title">تعديل المنتج</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="wz-ap__form">
          <div className="wz-ap__field">
            <label className="wz-ap__label">معرّف المنتج</label>
            <input
              {...register("productId")}
              className="wz-ap__input"
              placeholder="مثال: WZ-0001"
              required
              dir="rtl"
              style={{ direction: "rtl", unicodeBidi: "plaintext" }}
            />
          </div>

          <div className="wz-ap__row2">
            <div className="wz-ap__field">
              <label className="wz-ap__label">القَصّة</label>
              <input {...register("coupe")} className="wz-ap__input" placeholder="مثال: Slim / Classic" />
            </div>
            <div className="wz-ap__field">
              <label className="wz-ap__label">الخامة</label>
              <input {...register("matiere")} className="wz-ap__input" placeholder="مثال: صوف / قطن" />
            </div>
          </div>

          <div className="wz-ap__row2">
            <div className="wz-ap__field">
              <label className="wz-ap__label">التركيبة</label>
              <input {...register("composition")} className="wz-ap__input" placeholder="مثال: %80 صوف، %20..." />
            </div>
            <div className="wz-ap__field">
              <label className="wz-ap__label">بلد الصنع</label>
              <input {...register("madeIn")} className="wz-ap__input" placeholder="مثال: تونس" />
            </div>
          </div>

          <div className="wz-ap__checkRow" style={{ justifyContent: "flex-end" }}>
            <input type="checkbox" {...register("isHandmade")} className="wz-ap__checkbox" />
            <span style={{ fontWeight: 900 }}>صناعة يدوية</span>
          </div>

          <div className="wz-ap__field">
            <label className="wz-ap__label">وصف المنتج</label>
            <textarea {...register("description")} className="wz-ap__textarea" placeholder="اكتب وصفًا واضحًا للمنتج..." required rows={3} />
          </div>

          {/* ✅ MAIN category keys */}
          <div className="wz-ap__field">
            <label className="wz-ap__label">الفئة</label>
            <select {...register("category")} className="wz-ap__select" required>
              <option value="">اختر الفئة</option>
              <option value="men">رجال</option>
              <option value="women">نساء</option>
              <option value="children">أطفال</option>
            </select>
          </div>

          <div className="wz-ap__field">
            <label className="wz-ap__label">الفئة الفرعية (اختياري)</label>
            <select {...register("subCategory")} className="wz-ap__select">
              {SUBCATEGORY_OPTIONS.map((c) => (
                <option key={c.value || "none"} value={c.value}>
                  {c.labelAr}
                </option>
              ))}
            </select>
          </div>

          <div className="wz-ap__field">
            <label className="wz-ap__label">فئة التطريز (اختياري)</label>
            <input {...register("embroideryCategory")} className="wz-ap__input" placeholder="مثال: تطريز يدوي / تقليدي..." />
          </div>

          <div className="wz-ap__block">
            <div className="wz-ap__blockTitle">المقاسات (اختياري)</div>
            <div className="wz-ap__sizes">
              {ALL_SIZES.map((sz) => {
                const active = sizeSet.has(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`wz-ap__sizeBtn ${active ? "is-active" : ""}`}
                    aria-pressed={active}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register("sizes")} />
            <div className="wz-ap__hint">
              المقاسات المختارة: <span style={{ fontWeight: 900 }}>{sizes.length ? sizes.join(" - ") : "—"}</span>
            </div>
          </div>

          <div className="wz-ap__row2">
            <div className="wz-ap__field">
              <label className="wz-ap__label">السعر القديم (اختياري)</label>
              <input {...register("oldPrice")} type="number" className="wz-ap__input" placeholder="0.00" step="0.01" min="0" />
            </div>
            <div className="wz-ap__field">
              <label className="wz-ap__label">السعر الجديد (اختياري)</label>
              <input {...register("newPrice")} type="number" className="wz-ap__input" placeholder="0.00" step="0.01" min="0" />
            </div>
          </div>

          <div className="wz-ap__field">
            <label className="wz-ap__label">التقييم (0–5)</label>
            <input {...register("rating")} type="number" min="0" max="5" step="0.5" className="wz-ap__input" placeholder="مثال: 4.5" />
          </div>

          <div className="wz-ap__checkRow" style={{ justifyContent: "flex-end" }}>
            <input type="checkbox" {...register("trending")} className="wz-ap__checkbox" />
            <span style={{ fontWeight: 900 }}>منتج رائج</span>
          </div>

          {/* Cover */}
          <div className="wz-ap__block">
            <div className="wz-ap__blockTitle">تغيير الصورة الرئيسية (اختياري)</div>

            <div className="wz-ap__fileRow" style={{ justifyContent: "flex-end" }}>
              {coverPreviewURL && (
                <>
                  <button type="button" onClick={() => openInNewTab(coverPreviewURL)} className="wz-ap__btn wz-ap__btnSoft wz-ap__btnInline">
                    فتح
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCoverImageFile(null);
                      setCoverPreviewURL(product?.coverImage ? fullUrl(product.coverImage) : "");
                    }}
                    className="wz-ap__btn wz-ap__btnSoft wz-ap__btnInline"
                  >
                    إلغاء
                  </button>
                </>
              )}

              <input id="cover-file" type="file" accept="image/*" className="hidden" onChange={handleCoverImageChange} />
              <label htmlFor="cover-file" className="wz-ap__fileLabel">
                اختيار صورة
              </label>
            </div>

            {coverPreviewURL && (
              <img src={coverPreviewURL} alt="cover-preview" className="wz-ap__coverPreview" onClick={() => openInNewTab(coverPreviewURL)} />
            )}
          </div>

          {/* Colors */}
          <div className="wz-ap__block">
            <div className="wz-ap__blockTitle">ألوان المنتج</div>

            <div style={{ display: "grid", gap: 12 }}>
              {colorInputs.map((color, index) => (
                <div key={index} className="wz-ap__colorCard">
                  <div className="wz-ap__field">
                    <label className="wz-ap__label">اسم اللون (اختياري)</label>
                    <input
                      type="text"
                      className="wz-ap__input"
                      value={color.colorName}
                      onChange={(e) => setColorAt(index, { colorName: e.target.value })}
                      placeholder="مثال: أسود / أبيض..."
                    />
                  </div>

                  <div className="wz-ap__field">
                    <label className="wz-ap__label">الكمية في المخزون</label>
                    <input type="number" className="wz-ap__input" value={color.stock} onChange={(e) => setColorAt(index, { stock: Number(e.target.value) || 0 })} placeholder="0" required min="0" />
                  </div>

                  <div className="wz-ap__fileRow" style={{ justifyContent: "flex-end" }}>
                    {color.pendingPreview && (
                      <button type="button" onClick={() => openInNewTab(color.pendingPreview)} className="wz-ap__btn wz-ap__btnSoft wz-ap__btnInline">
                        فتح المعاينة
                      </button>
                    )}

                    <button type="button" onClick={() => uploadPendingColorFile(index)} disabled={!color.pendingFile || color.uploading} className="wz-ap__btn wz-ap__btnAccent wz-ap__btnInline">
                      {color.uploading ? "جارٍ الرفع..." : "رفع"}
                    </button>

                    <button type="button" onClick={() => cancelPendingColorFile(index)} disabled={!color.pendingFile || color.uploading} className="wz-ap__btn wz-ap__btnSoft wz-ap__btnInline">
                      إلغاء
                    </button>

                    <input id={`color-file-${index}`} type="file" accept="image/*" className="hidden" onChange={(e) => handlePickColorFile(index, e.target.files?.[0])} />
                    <label htmlFor={`color-file-${index}`} className="wz-ap__fileLabel">
                      اختيار صورة
                    </label>
                  </div>

                  {color.pendingPreview && (
                    <div className="wz-ap__pendingPreviewRow">
                      <span className="wz-ap__pendingPreviewText">معاينة (قبل الرفع):</span>
                      <img src={color.pendingPreview} alt="pending" className="wz-ap__pendingThumb" onClick={() => openInNewTab(color.pendingPreview)} />
                    </div>
                  )}

                  {color.images?.length > 0 && (
                    <div className="wz-ap__thumbGrid">
                      {color.images.map((img, imgIdx) => {
                        const final = fullUrl(img);
                        return (
                          <div key={imgIdx}>
                            <img src={final} alt={`img-${imgIdx}`} className="wz-ap__thumb" onClick={() => openInNewTab(final)} />
                            <div className="wz-ap__thumbActions">
                              <a className="wz-ap__openLink" href={final} target="_blank" rel="noreferrer noopener">فتح</a>
                              <button type="button" onClick={() => removeColorImage(index, imgIdx)} className="wz-ap__thumbRemove">حذف</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {colorInputs.length > 1 && (
                    <button type="button" onClick={() => deleteColorInput(index)} className="wz-ap__btn wz-ap__btnDanger">
                      حذف اللون
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <button type="button" onClick={addColorInput} className="wz-ap__btn wz-ap__btnSoft">
                إضافة لون
              </button>
            </div>
          </div>

          <button type="submit" disabled={saving} className="wz-ap__btn wz-ap__btnPrimary">
            {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProduct;