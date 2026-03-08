// src/redux/features/products/productsSlice.js

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  products: [],
  shouldRefetch: false,
  lastUpdatedAt: null,
};

const getProductKey = (product) => String(product?.productId || "").trim();
const getIdKey = (value) => String(value || "").trim();

const productsSlice = createSlice({
  name: "product",
  initialState,

  reducers: {
    // Replace cached list
    setProducts: (state, action) => {
      state.products = Array.isArray(action.payload) ? action.payload : [];
      state.lastUpdatedAt = Date.now();
    },

    // Add one product to cache
    addOneProduct: (state, action) => {
      const p = action.payload;
      const key = getProductKey(p);
      if (!key) return;

      const exists = state.products.some((x) => getProductKey(x) === key);
      if (!exists) state.products.unshift(p);

      state.lastUpdatedAt = Date.now();
    },

    // Update one product in cache
    updateOneProduct: (state, action) => {
      const p = action.payload;
      const key = getProductKey(p);
      if (!key) return;

      state.products = state.products.map((x) =>
        getProductKey(x) === key ? p : x
      );

      state.lastUpdatedAt = Date.now();
    },

    // Remove one product from cache
    removeOneProduct: (state, action) => {
      const id = getIdKey(action.payload);
      if (!id) return;

      state.products = state.products.filter((x) => getProductKey(x) !== id);
      state.lastUpdatedAt = Date.now();
    },

    // Cross-component refresh trigger
    triggerRefetch: (state) => {
      state.shouldRefetch = true;
    },

    resetRefetch: (state) => {
      state.shouldRefetch = false;
    },
  },
});

export const {
  setProducts,
  addOneProduct,
  updateOneProduct,
  removeOneProduct,
  triggerRefetch,
  resetRefetch,
} = productsSlice.actions;

export default productsSlice.reducer;