// src/redux/features/orders/ordersApi.js
// ============================================================================

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import getBaseUrl from "../../../utils/baseURL";

/* -----------------------------------------------------------------------------
   Helpers
----------------------------------------------------------------------------- */
const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const normalizeOrderLine = (line = {}) => {
  const qty = Math.max(1, toNum(line?.quantity, 1));
  const images = Array.isArray(line?.color?.images)
    ? line.color.images.filter(Boolean)
    : [];

  const image =
    String(line?.color?.image || "").trim() ||
    images[0] ||
    String(line?.coverImage || "").trim() ||
    "";

  return {
    ...line,
    quantity: qty,
    price: toNum(line?.price ?? line?.unitPrice ?? line?.newPrice, 0),
    unitPrice: toNum(line?.unitPrice ?? line?.price ?? line?.newPrice, 0),
    newPrice: toNum(line?.newPrice ?? line?.unitPrice ?? line?.price, 0),
    color: {
      ...(line?.color || {}),
      image,
      images: images.length ? images : image ? [image] : [],
    },
  };
};

const normalizeOrder = (order) => {
  if (!order || typeof order !== "object") return order;

  const products = Array.isArray(order?.products)
    ? order.products.map(normalizeOrderLine)
    : [];

  const shipping = toNum(order?.totals?.shipping, toNum(order?.shipping, 0));
  const subtotal =
    toNum(order?.totals?.subtotal, 0) ||
    products.reduce((sum, line) => {
      return sum + toNum(line?.price ?? line?.unitPrice ?? line?.newPrice, 0) * Math.max(1, toNum(line?.quantity, 1));
    }, 0);

  const total =
    toNum(order?.totals?.total, 0) ||
    toNum(order?.totalPrice, 0) ||
    toNum(order?.total, 0) ||
    subtotal + shipping;

  return {
    ...order,
    products,
    totals: {
      subtotal,
      shipping,
      total,
    },
    subtotal,
    shipping,
    totalPrice: total,
    total,
  };
};

const baseQuery = fetchBaseQuery({
  baseUrl: `${String(getBaseUrl() || "").replace(/\/$/, "")}/api/orders`,
  prepareHeaders: (headers) => {
    headers.set("accept", "application/json");
    return headers;
  },
});

export const ordersApi = createApi({
  reducerPath: "ordersApi",
  baseQuery,
  tagTypes: ["Orders", "Order"],
  endpoints: (builder) => ({
    /* ---------------- GUEST ---------------- */

    createOrder: builder.mutation({
      query: (payload) => ({
        url: "/",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response) => ({
        ...response,
        order: normalizeOrder(response?.order),
      }),
      invalidatesTags: [{ type: "Orders", id: "LIST" }],
    }),

    trackOrder: builder.query({
      query: (orderId) => `/track/${encodeURIComponent(String(orderId || "").trim())}`,
      transformResponse: (response) => normalizeOrder(response),
      providesTags: (_res, _err, orderId) => [
        { type: "Order", id: `track:${String(orderId || "").trim()}` },
      ],
    }),

    getOrdersByEmail: builder.query({
      query: (email) => `/email/${encodeURIComponent(String(email || "").trim())}`,
      transformResponse: (response) =>
        Array.isArray(response) ? response.map(normalizeOrder) : [],
      providesTags: [{ type: "Orders", id: "LIST" }],
    }),

    /* ---------------- ADMIN ---------------- */

    getAllOrders: builder.query({
      query: () => "/",
      transformResponse: (response) =>
        Array.isArray(response) ? response.map(normalizeOrder) : [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map((o) => ({ type: "Order", id: String(o?._id || "") })),
              { type: "Orders", id: "LIST" },
            ]
          : [{ type: "Orders", id: "LIST" }],
      keepUnusedDataFor: 5,
    }),

    getOrderById: builder.query({
      query: (mongoId) => `/${encodeURIComponent(String(mongoId || "").trim())}`,
      transformResponse: (response) => normalizeOrder(response),
      providesTags: (_res, _err, mongoId) => [
        { type: "Order", id: String(mongoId || "").trim() },
      ],
    }),

    updateOrder: builder.mutation({
      query: ({ orderId, ...patch }) => {
        const id = String(orderId || "").trim();
        return {
          url: `/${encodeURIComponent(id)}`,
          method: "PATCH",
          body: patch,
        };
      },
      transformResponse: (response) => normalizeOrder(response),
      invalidatesTags: (_res, _err, arg) => [
        { type: "Order", id: String(arg?.orderId || "").trim() },
        { type: "Orders", id: "LIST" },
      ],
    }),

    deleteOrder: builder.mutation({
      query: (orderId) => ({
        url: `/${encodeURIComponent(String(orderId || "").trim())}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, orderId) => [
        { type: "Order", id: String(orderId || "").trim() },
        { type: "Orders", id: "LIST" },
      ],
    }),

    /* ---------------- OPTIONAL ---------------- */

    removeProductFromOrder: builder.mutation({
      query: (payload) => ({
        url: "/remove-product",
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: [{ type: "Orders", id: "LIST" }],
    }),

    sendOrderNotification: builder.mutation({
      query: (payload) => ({
        url: "/notify",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [{ type: "Orders", id: "LIST" }],
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useTrackOrderQuery,
  useLazyTrackOrderQuery,
  useGetOrdersByEmailQuery,

  useGetAllOrdersQuery,
  useGetOrderByIdQuery,
  useUpdateOrderMutation,
  useDeleteOrderMutation,

  useRemoveProductFromOrderMutation,
  useSendOrderNotificationMutation,
} = ordersApi;

export default ordersApi;