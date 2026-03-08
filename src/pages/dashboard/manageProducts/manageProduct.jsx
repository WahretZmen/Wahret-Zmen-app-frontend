// src/pages/dashboard/products/ManageProducts.jsx

import { Link, useLocation } from "react-router-dom";
import {
  useDeleteProductMutation,
  useGetAllProductsQuery,
} from "../../../redux/features/products/productsApi";
import Swal from "sweetalert2";
import { getImgUrl } from "../../../utils/getImgUrl";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import { productEventsActions } from "../../../redux/features/products/productEventsSlice";
import "../../../Styles/StylesManageProducts.css";

/* ⭐ Force LTR for IDs, emails, numbers */
const ltrTextStyle = { direction: "ltr", unicodeBidi: "plaintext" };

/* Small rating component */
const Stars = ({ value = 0 }) => {
  const v = Number(value ?? 0);
  const full = Math.floor(v);
  const half = v - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  const star = "★";
  const emptyStar = "☆";

  return (
    <div className="mp-stars">
      <span>
        {"".padStart(full, star)}
        {half ? "⯪" : ""}
        {"".padStart(empty, emptyStar)}
      </span>
      <span className="mp-stars__value">({v.toFixed(1)})</span>
    </div>
  );
};

const toSearchString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    try {
      return Object.values(value)
        .filter((v) => typeof v === "string")
        .join(" ");
    } catch {
      return "";
    }
  }
  return "";
};

const getEmbroideryLabel = (emb) => {
  if (!emb) return "—";
  if (typeof emb === "string") return emb.trim() || "—";
  if (typeof emb === "object") return emb.ar || emb.fr || emb.en || "—";
  return "—";
};

const getColorName = (color) => {
  if (!color) return "افتراضي";
  if (typeof color.colorName === "object") {
    return color.colorName.ar || color.colorName.en || color.colorName.fr || "افتراضي";
  }
  return color.colorName || "افتراضي";
};

const SUBCATEGORY_AR = {
  "": "—",
  accessories: "إكسسوارات",
  costume: "بدلة",
  vest: "صدريّة",
  mens_abaya: "عباية رجالي",
  jebba: "جبّة",
};

const ManageProducts = () => {
  const location = useLocation();

  const {
    data: products = [],
    isLoading,
    isError,
    refetch,
  } = useGetAllProductsQuery();

  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();

  const dispatch = useDispatch();
  const shouldRefetch = useSelector((state) => state.productEvents.shouldRefetch);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchProductId, setSearchProductId] = useState("");

  // ✅ DB keys are lowercase
  const categoryMapping = {
    men: "رجال",
    women: "نساء",
    children: "أطفال",
  };

  useEffect(() => {
    if (shouldRefetch) {
      refetch();
      dispatch(productEventsActions.resetRefetch());
    }
  }, [shouldRefetch, refetch, dispatch]);

  useEffect(() => {
    if (location?.state?.updatedProductId) {
      setSearchProductId(String(location.state.updatedProductId));
    }
  }, [location]);

  const handleDeleteProduct = async (productId) => {
    const confirmResult = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: "لا يمكنك التراجع بعد الحذف!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#111827",
      confirmButtonText: "نعم، احذفه!",
      cancelButtonText: "إلغاء",
    });

    if (!confirmResult.isConfirmed) return;

    try {
      await deleteProduct(productId).unwrap();
      Swal.fire("تم الحذف!", "تم حذف المنتج بنجاح.", "success");
      refetch();
    } catch (error) {
      Swal.fire(
        "خطأ!",
        error?.data?.message || "فشل في حذف المنتج. يرجى المحاولة مرة أخرى.",
        "error"
      );
    }
  };

  const handleCopyId = async (text) => {
    const idText = String(text || "");
    if (!idText) return;

    const okToast = () =>
      Swal.fire({
        icon: "success",
        title: "تم النسخ",
        text: "تم النسخ بنجاح.",
        confirmButtonColor: "#8B5C3E",
      });

    try {
      await navigator.clipboard.writeText(idText);
      okToast();
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = idText;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        okToast();
      } catch {
        Swal.fire({
          icon: "error",
          title: "تعذّر النسخ",
          text: "يرجى النسخ يدويًا.",
          confirmButtonColor: "#d33",
        });
      }
    }
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const pidTerm = searchProductId.trim().toLowerCase();

    return (products || []).filter((p) => {
      const pidOk =
        pidTerm === "" ||
        (p?.productId && String(p.productId).toLowerCase().includes(pidTerm));

      if (!pidOk) return false;
      if (!term) return true;

      const searchFields = [
        p?.productId,
        getEmbroideryLabel(p?.embroideryCategory),
        p?.category,
        p?.subCategory,
        SUBCATEGORY_AR[p?.subCategory || ""] || "",
        ...(Array.isArray(p?.colors) ? p.colors.map((c) => getColorName(c)) : []),
      ]
        .map(toSearchString)
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchFields.includes(term);
    });
  }, [products, searchTerm, searchProductId]);

  return (
    <section className="mp-page" dir="rtl">
      <div className="mp-toolbar">
        <input
          type="text"
          placeholder="🔍 ابحث بالتطريز أو الفئة أو الفئة الفرعية أو الألوان..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mp-input"
        />

        <input
          type="text"
          placeholder="🔎 ابحث بـ Product ID..."
          value={searchProductId}
          onChange={(e) => setSearchProductId(e.target.value)}
          className="mp-input"
          dir="ltr"
          style={{ unicodeBidi: "plaintext" }}
        />
      </div>

      <div className="mp-tablewrap">
        <table className="mp-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product ID</th>
              <th>صورة</th>
              <th>الفئة</th>
              <th>الفئة الفرعية</th>
              <th>فئة التطريز</th>
              <th>الألوان</th>
              <th>المخزون</th>
              <th>التقييم</th>
              <th>إجراءات</th>
            </tr>
          </thead>

          <tbody>
            {isLoading && (
              <tr>
                <td colSpan="10" className="mp-empty">
                  جارٍ تحميل المنتجات...
                </td>
              </tr>
            )}

            {isError && !isLoading && (
              <tr>
                <td colSpan="10" className="mp-empty mp-empty--error">
                  حدث خطأ أثناء تحميل المنتجات.
                </td>
              </tr>
            )}

            {!isLoading && !isError && filteredProducts.length > 0 ? (
              filteredProducts.map((p, index) => {
                const totalStock =
                  p?.colors?.reduce((sum, c) => sum + (c?.stock || 0), 0) || 0;

                const embroideryLabel = getEmbroideryLabel(p?.embroideryCategory);
                const catAr = categoryMapping[p.category] || "غير مصنّف";
                const subAr = SUBCATEGORY_AR[p?.subCategory || ""] || "—";
                const imageUrl = getImgUrl(p.coverImage);
                const pid = String(p?.productId || "").trim();

                return (
                  <tr key={pid || index}>
                    <td className="mp-td">{index + 1}</td>

                    <td className="mp-td">
                      <div className="mp-idcell">
                        <span
                          style={ltrTextStyle}
                          className="mp-idtext"
                          title={pid}
                        >
                          {pid || "—"}
                        </span>

                        <button
                          type="button"
                          className="mp-btn mp-btn--ghost"
                          onClick={() => handleCopyId(pid)}
                        >
                          نسخ
                        </button>
                      </div>
                    </td>

                    <td className="mp-td">
                      <div className="mp-imgwrap">
                        <a
                          href={imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="عرض الصورة كاملة في تبويب جديد"
                          aria-label="عرض الصورة كاملة في تبويب جديد"
                          className="mp-imglink"
                        >
                          <img
                            src={imageUrl}
                            alt={`product ${pid || ""}`}
                            className="mp-img"
                            loading="lazy"
                          />
                        </a>
                      </div>
                    </td>

                    <td className="mp-td mp-muted">{catAr}</td>
                    <td className="mp-td mp-muted">{subAr}</td>

                    <td className="mp-td mp-muted">{embroideryLabel}</td>

                    <td className="mp-td">
                      <div className="mp-colors">
                        {p?.colors?.length ? (
                          p.colors.map((c, idx) => (
                            <div key={idx} className="mp-coloritem">
                              <span className="mp-colorname">{getColorName(c)}</span>
                              <span className="mp-colorstock">
                                ({Number(c.stock || 0)})
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="mp-dash">—</span>
                        )}
                      </div>
                    </td>

                    <td className="mp-td">
                      <span
                        className={
                          totalStock === 0 ? "mp-stock mp-stock--zero" : "mp-stock"
                        }
                      >
                        {totalStock > 0 ? `${totalStock} في المخزون` : "غير متوفر"}
                      </span>
                    </td>

                    <td className="mp-td">
                      <Stars value={Number(p.rating ?? 0)} />
                    </td>

                    <td className="mp-td">
                      <div className="mp-actions">
                        <Link
                          to={`/dashboard/edit-product/${encodeURIComponent(pid)}`}
                          className="mp-btn mp-btn--edit"
                        >
                          تعديل
                        </Link>

                        <button
                          onClick={() => handleDeleteProduct(pid)}
                          disabled={deleting}
                          className="mp-btn mp-btn--delete"
                          type="button"
                        >
                          {deleting ? "جارٍ الحذف..." : "حذف"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              !isLoading &&
              !isError && (
                <tr>
                  <td colSpan="10" className="mp-empty">
                    لا توجد منتجات.
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ManageProducts;