// src/redux/features/products/productEventsSlice.js


import { createSlice } from "@reduxjs/toolkit";

// -----------------------------------------------------------------------------
// Slice definition
// -----------------------------------------------------------------------------
const productEventsSlice = createSlice({
  name: "productEvents",

  // Single-flag state: when `true`, interested views should refetch products.
  initialState: { shouldRefetch: false },

  reducers: {
    /**
     * Set the refetch flag to true.
     * Views/selectors can watch this and kick off a products refetch.
     */
    triggerRefetch: (state) => {
      state.shouldRefetch = true;
    },

    /**
     * Reset the refetch flag to false after the refetch logic has run.
     * Call this once your component has handled the refresh.
     */
    resetRefetch: (state) => {
      state.shouldRefetch = false;
    },
  },
});

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------
export const productEventsActions = productEventsSlice.actions;
export default productEventsSlice.reducer;
