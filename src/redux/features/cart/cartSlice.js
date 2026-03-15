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
    // addToCart
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

      const qtyToAdd = Math.max(1, Number(payload.quantity || 1));

      if (existingItem) {
        existingItem.quantity = Math.max(1, Number(existingItem.quantity || 1) + qtyToAdd);
      } else {
        state.cartItems.push({
          ...payload,
          productId,
          id: productId,
          quantity: qtyToAdd,
          color: normalizedColor,
          colorKey,
        });
      }
    },

    // removeFromCart
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

    // updateQuantity
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
        const next = Math.max(1, Number(payload.quantity || 1));
        item.quantity = next;
      }
    },

    // clearCart
    clearCart: (state) => {
      state.cartItems = [];
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } =
  cartSlice.actions;

export default cartSlice.reducer;