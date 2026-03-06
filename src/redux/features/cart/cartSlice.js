// src/redux/features/cart/cartSlice.js
import { createSlice } from "@reduxjs/toolkit";
import Swal from "sweetalert2";

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

const normalizeColorNameToObj = (colorName) => {
  // Keep your multilingual shape
  if (typeof colorName === "object" && colorName) return colorName;
  const s = pick(colorName, "Original");
  return { en: s || "Original", fr: s || "Original", ar: "أصلي" };
};

/**
 * Build a stable "colorKey" stored in cart lines.
 * - BEST: selected image (img:<url>) -> stable across languages
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

const toast = (icon, title) => {
  Swal.fire({
    position: "top-end",
    icon,
    title,
    showConfirmButton: false,
    timer: 1300,
  });
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
      const { _id, coverImage } = payload;

      if (!_id) return;

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
        (item) => item._id === _id && item.colorKey === colorKey
      );

      const qtyToAdd = Math.max(1, Number(payload.quantity || 1));

      if (existingItem) {
        existingItem.quantity = Math.max(1, Number(existingItem.quantity || 1) + qtyToAdd);
      } else {
        state.cartItems.push({
          ...payload,
          quantity: qtyToAdd,
          color: normalizedColor,
          colorKey, // ✅ stored for stable matching (used later in order tracking too)
        });
      }

      toast("success", "تمت إضافة المنتج إلى العربة");
    },

    // removeFromCart
    removeFromCart: (state, action) => {
      const payload = action.payload || {};
      const { _id } = payload;
      if (!_id) return;

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
        (item) => !(item._id === _id && item.colorKey === computedKey)
      );

      toast("info", "تم حذف المنتج من العربة");
    },

    // updateQuantity
    updateQuantity: (state, action) => {
      const payload = action.payload || {};
      const { _id, quantity } = payload;
      if (!_id) return;

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
        (it) => it._id === _id && it.colorKey === computedKey
      );

      if (item) {
        const next = Math.max(1, Number(quantity || 1));
        item.quantity = next;
      }
    },

    // clearCart
    clearCart: (state) => {
      state.cartItems = [];
      toast("warning", "تم تفريغ العربة");
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } =
  cartSlice.actions;

export default cartSlice.reducer;