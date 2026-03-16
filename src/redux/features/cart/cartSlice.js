// src/redux/features/cart/cartSlice.js
import { createSlice } from "@reduxjs/toolkit";

/* -----------------------------
   Helpers
------------------------------ */

const pick = (v, d = "") => {
  if (v == null) return d;
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const getProductId = (payload) =>
  pick(
    payload?.productId ||
      payload?.id ||
      payload?._id ||
      payload?.product?.productId ||
      payload?.product?.id ||
      payload?.product?._id,
    ""
  );

const normalizeColorNameToObj = (colorName) => {
  if (typeof colorName === "object" && colorName) return colorName;
  const s = pick(colorName, "Original");
  return { en: s || "Original", fr: s || "Original", ar: "أصلي" };
};

/**
 * Build a stable color key stored in cart lines.
 * - BEST: selected image (img:<url>)
 * - fallback: name object (name:<json>)
 */
const buildColorKey = (color, coverImage = "") => {
  const img =
    pick(color?.image, "") ||
    pick(Array.isArray(color?.images) ? color.images[0] : "", "") ||
    pick(coverImage, "");

  if (img) return `img:${img}`;

  const nameObj = normalizeColorNameToObj(color?.colorName);
  return `name:${JSON.stringify(nameObj)}`;
};

const ensureImages = (color, coverImage) => {
  const image = pick(color?.image, "") || pick(coverImage, "");
  const images = Array.isArray(color?.images) ? color.images.filter(Boolean) : [];
  const safeImages = images.length ? images : image ? [image] : [];
  return { image, images: safeImages };
};

const getMaxStock = (payload) => {
  const colorStock = toNum(payload?.color?.stock, NaN);
  if (Number.isFinite(colorStock)) return Math.max(0, colorStock);

  const totalStock = toNum(payload?.stockQuantity ?? payload?.stock, NaN);
  if (Number.isFinite(totalStock)) return Math.max(0, totalStock);

  return Infinity;
};

const clampQuantity = (qty, maxStock) => {
  const next = Math.max(1, toNum(qty, 1));
  if (Number.isFinite(maxStock)) {
    if (maxStock <= 0) return 0;
    return Math.min(next, maxStock);
  }
  return next;
};

/* -----------------------------
   Initial State
------------------------------ */

const initialState = {
  cartItems: [],
};

/* -----------------------------
   Slice
------------------------------ */

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const payload = action.payload || {};
      const productId = getProductId(payload);
      const coverImage = payload?.coverImage || "";

      if (!productId) return;

      const incomingColor = payload.color || {};
      const normalizedColorName = normalizeColorNameToObj(incomingColor?.colorName);
      const { image, images } = ensureImages(incomingColor, coverImage);

      const normalizedColor = {
        ...incomingColor,
        colorName: normalizedColorName,
        image,
        images,
      };

      const colorKey = payload.colorKey || buildColorKey(normalizedColor, coverImage);

      const existingItem = state.cartItems.find(
        (item) => item.productId === productId && item.colorKey === colorKey
      );

      const maxStock = getMaxStock({
        ...payload,
        color: normalizedColor,
      });

      if (Number.isFinite(maxStock) && maxStock <= 0) return;

      const qtyToAdd = Math.max(1, Number(payload.quantity || 1));

      if (existingItem) {
        existingItem.quantity = clampQuantity(
          Number(existingItem.quantity || 1) + qtyToAdd,
          maxStock
        );
      } else {
        const initialQty = clampQuantity(qtyToAdd, maxStock);
        if (initialQty <= 0) return;

        state.cartItems.push({
          ...payload,
          productId,
          id: productId,
          quantity: initialQty,
          color: normalizedColor,
          colorKey,
        });
      }
    },

    removeFromCart: (state, action) => {
      const payload = action.payload || {};
      const productId = getProductId(payload);
      if (!productId) return;

      const computedKey =
        payload.colorKey ||
        buildColorKey(
          {
            ...(payload.color || {}),
            colorName: normalizeColorNameToObj(payload?.color?.colorName),
          },
          payload.coverImage
        );

      state.cartItems = state.cartItems.filter(
        (item) => !(item.productId === productId && item.colorKey === computedKey)
      );
    },

    updateQuantity: (state, action) => {
      const payload = action.payload || {};
      const productId = getProductId(payload);
      if (!productId) return;

      const computedKey =
        payload.colorKey ||
        buildColorKey(
          {
            ...(payload.color || {}),
            colorName: normalizeColorNameToObj(payload?.color?.colorName),
          },
          payload.coverImage
        );

      const item = state.cartItems.find(
        (it) => it.productId === productId && it.colorKey === computedKey
      );

      if (item) {
        const maxStock = getMaxStock({
          ...item,
          ...payload,
          color: payload.color || item.color,
        });

        const next = clampQuantity(payload.quantity, maxStock);
        item.quantity = next > 0 ? next : 1;
      }
    },

    clearCart: (state) => {
      state.cartItems = [];
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } =
  cartSlice.actions;

export default cartSlice.reducer;