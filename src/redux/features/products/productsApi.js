// src/redux/features/products/productsApi.js

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import getBaseUrl from "../../../utils/baseURL";

/* -----------------------------------------------------------------------------
   Helpers
----------------------------------------------------------------------------- */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const pickText = (v) => {
  if (typeof v === "string") return v.trim();
  if (v && typeof v === "object") return String(v.ar || v.fr || v.en || "").trim();
  return "";
};

const toLangObject = (v) => {
  const txt = pickText(v);
  return { ar: txt, fr: txt, en: txt };
};

const normalizeEmbroideryCategory = (v) => {
  if (!v) return { ar: "", fr: "", en: "" };
  if (typeof v === "string") {
    const txt = v.trim();
    return { ar: txt, fr: txt, en: txt };
  }

  if (typeof v === "object") {
    const ar = String(v.ar || "").trim();
    const fr = String(v.fr || "").trim();
    const en = String(v.en || "").trim();
    return { ar, fr, en };
  }

  return { ar: "", fr: "", en: "" };
};

const normalizeSizes = (sizes) => {
  if (!sizes) return [];

  if (Array.isArray(sizes)) {
    return sizes.map((s) => String(s).trim()).filter(Boolean);
  }

  if (typeof sizes === "string") {
    try {
      const parsed = JSON.parse(sizes);
      if (Array.isArray(parsed)) {
        return parsed.map((s) => String(s).trim()).filter(Boolean);
      }
    } catch {
      return sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const normalizeColors = (colors, coverImage) =>
  (Array.isArray(colors) ? colors : []).map((c) => {
    const images =
      Array.isArray(c?.images) && c.images.length
        ? c.images.filter(Boolean)
        : c?.image
        ? [c.image].filter(Boolean)
        : [];

    return {
      ...c,
      images,
      image: images[0] || c?.image || coverImage || "",
      stock: Math.max(0, toNum(c?.stock, 0)),
    };
  });

const normalizeLangField = (v) => {
  if (!v) return { ar: "", fr: "", en: "" };
  if (typeof v === "string") return toLangObject(v);
  if (typeof v === "object") return { ar: v.ar || "", fr: v.fr || "", en: v.en || "" };
  return { ar: "", fr: "", en: "" };
};

const normalizeProduct = (p) => {
  if (!p || typeof p !== "object") return p;

  const publicId = String(p.productId || p._id || "").trim();

  return {
    ...p,
    id: publicId,
    productId: publicId,
    _id: p._id ?? "",
    title: p.title ?? "",
    description: p.description ?? "",
    category: p.category ?? "",
    subCategory: p.subCategory ?? "",
    coverImage: p.coverImage ?? "",

    oldPrice: p.oldPrice === null ? null : Math.max(0, toNum(p.oldPrice, 0)),
    newPrice: p.newPrice === null ? null : Math.max(0, toNum(p.newPrice, 0)),
    stockQuantity: Math.max(0, toNum(p.stockQuantity, 0)),
    trending: Boolean(p.trending),
    rating: clamp(toNum(p.rating, 0), 0, 5),

    translations: {
      ar: {
        title: p?.translations?.ar?.title ?? "",
        description: p?.translations?.ar?.description ?? "",
      },
      fr: {
        title: p?.translations?.fr?.title ?? "",
        description: p?.translations?.fr?.description ?? "",
      },
      en: {
        title: p?.translations?.en?.title ?? "",
        description: p?.translations?.en?.description ?? "",
      },
    },

    colors: normalizeColors(p.colors, p.coverImage),
    embroideryCategory: normalizeEmbroideryCategory(p.embroideryCategory),
    sizes: normalizeSizes(p.sizes),

    coupe: normalizeLangField(p.coupe),
    matiere: normalizeLangField(p.matiere),
    composition: normalizeLangField(p.composition),
    madeIn: normalizeLangField(p.madeIn),
    isHandmade: Boolean(p.isHandmade),

    tags: Array.isArray(p.tags) ? p.tags : [],
    labels: Array.isArray(p.labels) ? p.labels : [],
  };
};

/* -----------------------------------------------------------------------------
   Base Query
----------------------------------------------------------------------------- */
const baseQuery = fetchBaseQuery({
  baseUrl: `${getBaseUrl().replace(/\/$/, "")}/api/products`,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

/* -----------------------------------------------------------------------------
   API Slice
----------------------------------------------------------------------------- */
const productsApi = createApi({
  reducerPath: "productsApi",
  baseQuery,
  tagTypes: ["Products"],

  endpoints: (builder) => ({
    getAllProducts: builder.query({
      query: () => `/`,
      transformResponse: (response) =>
        (Array.isArray(response) ? response : []).map(normalizeProduct),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ productId }) => ({ type: "Products", id: productId })),
              { type: "Products", id: "LIST" },
            ]
          : [{ type: "Products", id: "LIST" }],
    }),

    getProductById: builder.query({
      query: (productId) => `/${encodeURIComponent(String(productId || "").trim())}`,
      transformResponse: (product) => normalizeProduct(product),
      providesTags: (result, error, productId) => [
        { type: "Products", id: String(productId || "").trim() },
      ],
    }),

    searchProducts: builder.query({
      query: (searchTerm) => `/search?query=${encodeURIComponent(searchTerm)}`,
      transformResponse: (response) =>
        (Array.isArray(response) ? response : []).map(normalizeProduct),
      providesTags: [{ type: "Products", id: "LIST" }],
    }),

    addProduct: builder.mutation({
      query: (newProduct) => {
        const payload = {
          productId: String(newProduct?.productId ?? "").trim(),
          title: String(newProduct?.title ?? "").trim(),
          description: newProduct?.description ?? "",
          category: String(newProduct?.category ?? "").trim().toLowerCase(),
          subCategory: newProduct?.subCategory ?? "",
          coverImage: newProduct?.coverImage ?? "",

          oldPrice:
            newProduct?.oldPrice === null ? null : toNum(newProduct?.oldPrice, 0),
          newPrice:
            newProduct?.newPrice === null ? null : toNum(newProduct?.newPrice, 0),
          stockQuantity: toNum(newProduct?.stockQuantity, 0),

          trending: Boolean(newProduct?.trending),
          rating: clamp(toNum(newProduct?.rating, 0), 0, 5),

          sizes: Array.isArray(newProduct?.sizes) ? newProduct.sizes : [],

          colors: (newProduct?.colors || []).map((c) => {
            const images =
              Array.isArray(c?.images) && c.images.length
                ? c.images.filter(Boolean)
                : c?.image
                ? [c.image].filter(Boolean)
                : [];

            return {
              ...(c?._id ? { _id: c._id } : {}),
              ...c,
              colorName: c.colorName,
              images,
              image: images[0] || c?.image || "",
              stock: Math.max(0, toNum(c?.stock, 0)),
            };
          }),

          embroideryCategory: toLangObject(newProduct?.embroideryCategory),

          coupe: toLangObject(newProduct?.coupe),
          matiere: toLangObject(newProduct?.matiere),
          composition: toLangObject(newProduct?.composition),
          madeIn: toLangObject(newProduct?.madeIn),
          isHandmade: Boolean(newProduct?.isHandmade),

          ...(newProduct?.translations ? { translations: newProduct.translations } : {}),
        };

        return {
          url: `/create-product`,
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/json" },
        };
      },
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),

    updateProduct: builder.mutation({
      query: ({ id, productId: currentProductId, ...rest }) => {
        const routeProductId = String(id ?? currentProductId ?? "").trim();

        const payload = {
          productId:
            rest?.productId !== undefined
              ? String(rest.productId ?? "").trim()
              : undefined,

          title: rest?.title !== undefined ? String(rest.title ?? "").trim() : undefined,
          description: rest?.description ?? "",
          category:
            rest?.category !== undefined
              ? String(rest.category ?? "").trim().toLowerCase()
              : undefined,
          subCategory: rest?.subCategory ?? "",
          coverImage: rest?.coverImage ?? "",

          oldPrice: rest?.oldPrice !== undefined ? rest.oldPrice : undefined,
          newPrice: rest?.newPrice !== undefined ? rest.newPrice : undefined,
          stockQuantity:
            rest?.stockQuantity !== undefined ? toNum(rest.stockQuantity, 0) : undefined,

          trending:
            rest?.trending !== undefined ? Boolean(rest.trending) : undefined,
          rating:
            rest?.rating !== undefined ? clamp(toNum(rest.rating, 0), 0, 5) : undefined,

          sizes: Array.isArray(rest?.sizes) ? rest.sizes : undefined,

          colors: Array.isArray(rest?.colors)
            ? rest.colors.map((c) => {
                const images =
                  Array.isArray(c?.images) && c.images.length
                    ? c.images.filter(Boolean)
                    : c?.image
                    ? [c.image].filter(Boolean)
                    : [];

                return {
                  ...(c?._id ? { _id: c._id } : {}),
                  ...c,
                  colorName: c.colorName,
                  images,
                  image: images[0] || c?.image || "",
                  stock: Math.max(0, toNum(c?.stock, 0)),
                };
              })
            : undefined,

          embroideryCategory:
            rest?.embroideryCategory !== undefined
              ? toLangObject(rest.embroideryCategory)
              : undefined,

          coupe: rest?.coupe !== undefined ? toLangObject(rest.coupe) : undefined,
          matiere: rest?.matiere !== undefined ? toLangObject(rest.matiere) : undefined,
          composition:
            rest?.composition !== undefined ? toLangObject(rest.composition) : undefined,
          madeIn: rest?.madeIn !== undefined ? toLangObject(rest.madeIn) : undefined,
          isHandmade:
            rest?.isHandmade !== undefined ? Boolean(rest.isHandmade) : undefined,

          ...(rest?.translations ? { translations: rest.translations } : {}),
        };

        Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

        return {
          url: `/edit/${encodeURIComponent(routeProductId)}`,
          method: "PUT",
          body: payload,
          headers: { "Content-Type": "application/json" },
        };
      },
      invalidatesTags: (result, error, { id, productId }) => {
        const tagId = String(id ?? productId ?? "").trim();
        return [
          { type: "Products", id: tagId },
          { type: "Products", id: "LIST" },
        ];
      },
    }),

    deleteProduct: builder.mutation({
      query: (productId) => ({
        url: `/${encodeURIComponent(productId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, productId) => [
        { type: "Products", id: productId },
        { type: "Products", id: "LIST" },
      ],
    }),

    updateProductPriceByPercentage: builder.mutation({
      query: ({ productId, percentage }) => ({
        url: `/update-price/${encodeURIComponent(productId)}`,
        method: "PUT",
        body: { percentage },
        headers: { "Content-Type": "application/json" },
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Products", id: productId },
        { type: "Products", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAllProductsQuery,
  useGetProductByIdQuery,
  useSearchProductsQuery,
  useAddProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUpdateProductPriceByPercentageMutation,
} = productsApi;

export default productsApi;