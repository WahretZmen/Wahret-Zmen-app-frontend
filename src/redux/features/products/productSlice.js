// src/redux/features/products/productsSlice.js

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  products: [],
  shouldRefetch: false,
  lastUpdatedAt: null,
};

const productsSlice = createSlice({
  name: "product",
  initialState,

  reducers: {
    // Replace cached list
    setProducts: (state, action) => {
      state.products = Array.isArray(action.payload) ? action.payload : [];
      state.lastUpdatedAt = Date.now();
    },

    // Add one product to cache (optional helper)
    addOneProduct: (state, action) => {
      const p = action.payload;
      if (!p?._id) return;
      const exists = state.products.some((x) => x?._id === p._id);
      if (!exists) state.products.unshift(p);
      state.lastUpdatedAt = Date.now();
    },

    // Update one product in cache
    updateOneProduct: (state, action) => {
      const p = action.payload;
      if (!p?._id) return;
      state.products = state.products.map((x) => (x?._id === p._id ? p : x));
      state.lastUpdatedAt = Date.now();
    },

    // Remove one product from cache
    removeOneProduct: (state, action) => {
      const id = action.payload;
      state.products = state.products.filter((x) => x?._id !== id);
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
