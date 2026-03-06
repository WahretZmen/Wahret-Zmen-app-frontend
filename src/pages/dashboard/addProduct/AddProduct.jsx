import React, { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAddProductMutation } from "../../../redux/features/products/productsApi";
import Swal from "sweetalert2";
import axios from "axios";
import imageCompression from "browser-image-compression";
import getBaseUrl from "../../../utils/baseURL";
import "../../../Styles/StylesAddProduct.css";

const ALL_SIZES = ["S", "M", "L", "XL"];
const MAX_IMAGE_SIZE_MB = 50;
const AUTO_COMPRESS_THRESHOLD_MB = 12;

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

/* ✅ NEW sub categories (stored EN, shown AR) */
const SUBCATEGORY_OPTIONS = [
  { value: "", labelAr: "— بدون —" },
  { value: "accessories", labelAr: "إكسسوارات" },
  { value: "costume", labelAr: "بدلة" },
  { value: "vest", labelAr: "صدريّة" },
  { value: "mens_abaya", labelAr: "عباية رجالي" },
  { value: "jebba", labelAr: "جبّة" },
];

const AddProduct = () => {
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

  const [addProduct, { isLoading }] = useAddProductMutation();

  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverPreviewURL, setCoverPreviewURL] = useState("");

  const [colorInputs, setColorInputs] = useState([
    {
      colorName: "",
      stock: 0,
      images: [],
      pendingFile: null,
      pendingPreview: "",
      uploading: false,
    },
  ]);

  useEffect(() => {
    return () => {
      if (coverPreviewURL?.startsWith("blob:")) URL.revokeObjectURL(coverPreviewURL);
      colorInputs.forEach((c) => {
        if (c?.pendingPreview?.startsWith("blob:")) URL.revokeObjectURL(c.pendingPreview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const validateImageFile = (file) => {
    if (!file) return false;

    if (!file.type?.startsWith("image/") || !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      Swal.fire({
        icon: "warning",
        title: "نوع الملف غير صالح",
        text: "يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP أو AVIF أو GIF.",
        confirmButtonText: "حسناً",
      });
      return false;
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "الصورة كبيرة جداً",
        text: `الحد الأقصى المسموح به هو ${MAX_IMAGE_SIZE_MB}MB للصورة الواحدة.`,
        confirmButtonText: "حسناً",
      });
      return false;
    }

    return true;
  };

  const optimizeImageIfNeeded = async (file) => {
    if (!file) return file;

    const sizeMB = file.size / (1024 * 1024);

    if (sizeMB <= AUTO_COMPRESS_THRESHOLD_MB) {
      return file;
    }

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 9.5,
        maxWidthOrHeight: 2400,
        useWebWorker: true,
        initialQuality: 0.92,
        alwaysKeepResolution: true,
      });

      return compressed;
    } catch (error) {
      console.error("Image optimization failed, using original file:", error);
      return file;
    }
  };

  const uploadImage = async (file) => {
    if (!file) return "";

    try {
      const finalFile = await optimizeImageIfNeeded(file);

      const formData = new FormData();
      formData.append("image", finalFile);

      const res = await axios.post(`${getBaseUrl()}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return res.data.image || "";
    } catch (err) {
      console.error("❌ Image upload failed:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ!",
        text: "فشل رفع الصورة. يرجى المحاولة مرة أخرى.",
        confirmButtonText: "حسناً",
      });
      return "";
    }
  };

  const fullUrl = (url) => (url?.startsWith("http") ? url : `${getBaseUrl()}${url || ""}`);

  const openInNewTab = (url) => {
    const final = url?.startsWith("blob:")
      ? url
      : url?.startsWith("http")
      ? url
      : `${getBaseUrl()}${url || ""}`;
    if (!final) return;
    window.open(final, "_blank", "noopener,noreferrer");
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!validateImageFile(file)) {
      e.target.value = "";
      return;
    }

    if (coverPreviewURL?.startsWith("blob:")) URL.revokeObjectURL(coverPreviewURL);
    setCoverImageFile(file);
    setCoverPreviewURL(URL.createObjectURL(file));
  };

  const setColorAt = (index, patch) =>
    setColorInputs((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  const addColorInput = () =>
    setColorInputs((prev) => [
      ...prev,
      {
        colorName: "",
        stock: 0,
        images: [],
        pendingFile: null,
        pendingPreview: "",
        uploading: false,
      },
    ]);

  const deleteColorInput = (index) => {
    setColorInputs((prev) => {
      const target = prev[index];
      if (target?.pendingPreview?.startsWith("blob:")) URL.revokeObjectURL(target.pendingPreview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handlePickColorFile = (index, file) => {
    if (!validateImageFile(file)) return;

    setColorInputs((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        if (c.pendingPreview?.startsWith("blob:")) URL.revokeObjectURL(c.pendingPreview);
        return { ...c, pendingFile: file, pendingPreview: URL.createObjectURL(file) };
      })
    );
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
            return {
              ...c,
              images: [...c.images, url],
              pendingFile: null,
              pendingPreview: "",
              uploading: false,
            };
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
        Swal.fire({
          icon: "warning",
          title: "بيانات ناقصة!",
          text: "يرجى إدخال معرّف المنتج.",
          confirmButtonText: "حسناً",
        });
        return;
      }

      let coverImage = "";
      if (coverImageFile) coverImage = await uploadImage(coverImageFile);

      const preparedColors = colorInputs
        .map((c) => ({ ...c, colorName: (c.colorName || "").trim() }))
        .filter((c) => c.images.length > 0 || c.pendingFile);

      for (let i = 0; i < preparedColors.length; i++) {
        const color = preparedColors[i];
        if (color.pendingFile) {
          const url = await uploadImage(color.pendingFile);
          if (url) {
            color.images.push(url);
            if (color.pendingPreview?.startsWith("blob:")) URL.revokeObjectURL(color.pendingPreview);
            color.pendingFile = null;
            color.pendingPreview = "";
          }
        }
      }

      if (preparedColors.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "بيانات ناقصة!",
          text: "أضِف لونًا واحدًا على الأقل مع صورة.",
          confirmButtonText: "حسناً",
        });
        return;
      }

      if (preparedColors.some((c) => !Array.isArray(c.images) || c.images.length === 0)) {
        Swal.fire({
          icon: "warning",
          title: "صورة مفقودة!",
          text: "كل لون يجب أن يحتوي على صورة واحدة على الأقل.",
          confirmButtonText: "حسناً",
        });
        return;
      }

      if (!coverImage) coverImage = preparedColors[0]?.images?.[0] || "";
      if (!coverImage) {
        Swal.fire({
          icon: "warning",
          title: "الصورة الرئيسية!",
          text: "يرجى اختيار صورة رئيسية للمنتج.",
          confirmButtonText: "حسناً",
        });
        return;
      }

      const colorsForServer = preparedColors.map((c) => ({
        colorName: toLangObject(c.colorName),
        images: c.images,
        image: c.images?.[0],
        stock: Number(c.stock) || 0,
      }));

      const allowedCategories = ["Men", "Women", "Children"];
      const finalCategory = allowedCategories.includes(data.category) ? data.category : "Men";

      const allowedSubKeys = SUBCATEGORY_OPTIONS.map((x) => x.value);
      const finalSubCategory = allowedSubKeys.includes(data.subCategory) ? data.subCategory : "";

      const rating = Math.max(0, Math.min(5, Number(data.rating ?? 0)));
      const oldPrice = parseOptionalNumber(data.oldPrice);
      const newPrice = parseOptionalNumber(data.newPrice);

      const payload = {
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
        rating,
        sizes: Array.isArray(data.sizes) ? data.sizes : [],
      };

      await addProduct(payload).unwrap();

      Swal.fire({
        icon: "success",
        title: "تم إنشاء المنتج بنجاح!",
        confirmButtonText: "حسناً",
      });

      if (coverPreviewURL?.startsWith("blob:")) URL.revokeObjectURL(coverPreviewURL);

      reset({
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
      });

      setCoverImageFile(null);
      setCoverPreviewURL("");
      setColorInputs([
        {
          colorName: "",
          stock: 0,
          images: [],
          pendingFile: null,
          pendingPreview: "",
          uploading: false,
        },
      ]);
    } catch (error) {
      console.error("❌ Error adding product:", error?.data || error);
      Swal.fire({
        icon: "error",
        title: "خطأ!",
        text: error?.data?.message || "فشل في إضافة المنتج.",
        confirmButtonText: "حسناً",
      });
    }
  };

  return (
    <div className="wz-ap" dir="rtl">
      <div className="wz-ap__card">
        <h2 className="wz-ap__title">إضافة منتج جديد</h2>

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
            <textarea
              {...register("description")}
              className="wz-ap__textarea"
              placeholder="اكتب وصفًا واضحًا للمنتج..."
              required
              rows={3}
            />
          </div>

          <div className="wz-ap__field">
            <label className="wz-ap__label">الفئة</label>
            <select {...register("category")} className="wz-ap__select" required>
              <option value="">اختر الفئة</option>
              <option value="Men">رجال</option>
              <option value="Women">نساء</option>
              <option value="Children">أطفال</option>
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
            <input
              {...register("embroideryCategory")}
              className="wz-ap__input"
              placeholder="مثال: تطريز يدوي / تقليدي..."
            />
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

          <div className="wz-ap__block">
            <div className="wz-ap__blockTitle">الصورة الرئيسية</div>

            <div className="wz-ap__fileRow" style={{ justifyContent: "flex-end" }}>
              {coverPreviewURL && (
                <>
                  <button type="button" onClick={() => openInNewTab(coverPreviewURL)} className="wz-ap__btn wz-ap__btnSoft wz-ap__btnInline">
                    فتح
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (coverPreviewURL?.startsWith("blob:")) URL.revokeObjectURL(coverPreviewURL);
                      setCoverImageFile(null);
                      setCoverPreviewURL("");
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
              <img
                src={coverPreviewURL}
                alt="cover-preview"
                className="wz-ap__coverPreview"
                onClick={() => openInNewTab(coverPreviewURL)}
                title="انقر لفتح الصورة في تبويب جديد"
              />
            )}
          </div>

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
                      placeholder="مثال: أسود / أبيض / كحلي..."
                    />
                  </div>

                  <div className="wz-ap__field">
                    <label className="wz-ap__label">الكمية في المخزون</label>
                    <input
                      type="number"
                      className="wz-ap__input"
                      value={color.stock}
                      onChange={(e) => setColorAt(index, { stock: Number(e.target.value) || 0 })}
                      placeholder="0"
                      required
                      min="0"
                    />
                  </div>

                  <div className="wz-ap__fileRow" style={{ justifyContent: "flex-end" }}>
                    {color.pendingPreview && (
                      <button type="button" onClick={() => openInNewTab(color.pendingPreview)} className="wz-ap__btn wz-ap__btnSoft wz-ap__btnInline">
                        فتح المعاينة
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => uploadPendingColorFile(index)}
                      disabled={!color.pendingFile || color.uploading}
                      className="wz-ap__btn wz-ap__btnAccent wz-ap__btnInline"
                    >
                      {color.uploading ? "جارٍ الرفع..." : "رفع"}
                    </button>

                    <button
                      type="button"
                      onClick={() => cancelPendingColorFile(index)}
                      disabled={!color.pendingFile || color.uploading}
                      className="wz-ap__btn wz-ap__btnSoft wz-ap__btnInline"
                    >
                      إلغاء
                    </button>

                    <input
                      id={`color-file-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePickColorFile(index, e.target.files?.[0])}
                    />
                    <label htmlFor={`color-file-${index}`} className="wz-ap__fileLabel">
                      اختيار صورة
                    </label>
                  </div>

                  {color.pendingPreview && (
                    <div className="wz-ap__pendingPreviewRow">
                      <span className="wz-ap__pendingPreviewText">معاينة (قبل الرفع):</span>
                      <img
                        src={color.pendingPreview}
                        alt="pending"
                        className="wz-ap__pendingThumb"
                        onClick={() => openInNewTab(color.pendingPreview)}
                        title="انقر لفتح الصورة في تبويب جديد"
                      />
                    </div>
                  )}

                  {color.images.length > 0 && (
                    <div className="wz-ap__thumbGrid">
                      {color.images.map((img, imgIdx) => {
                        const final = fullUrl(img);
                        return (
                          <div key={imgIdx}>
                            <img
                              src={final}
                              alt={`img-${imgIdx}`}
                              className="wz-ap__thumb"
                              onClick={() => openInNewTab(final)}
                              title="انقر لفتح الصورة في تبويب جديد"
                            />
                            <div className="wz-ap__thumbActions">
                              <a className="wz-ap__openLink" href={final} target="_blank" rel="noreferrer noopener">
                                فتح
                              </a>
                              <button type="button" onClick={() => removeColorImage(index, imgIdx)} className="wz-ap__thumbRemove">
                                حذف
                              </button>
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

          <button type="submit" disabled={isLoading} className="wz-ap__btn wz-ap__btnPrimary">
            {isLoading ? "جارٍ الإضافة..." : "إضافة المنتج"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;