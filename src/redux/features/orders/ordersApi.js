// src/redux/features/orders/ordersApi.js
// ============================================================================

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import getBaseUrl from "../../../utils/baseURL";

const baseQuery = fetchBaseQuery({
  baseUrl: `${String(getBaseUrl() || "").replace(/\/$/, "")}/api/orders`,
  prepareHeaders: (headers, { getState }) => {
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
      invalidatesTags: ["Orders"],
    }),

    trackOrder: builder.query({
      query: (orderId) => `/track/${encodeURIComponent(String(orderId || "").trim())}`,
      providesTags: (_res, _err, orderId) => [{ type: "Order", id: `track:${orderId}` }],
    }),

    getOrdersByEmail: builder.query({
      query: (email) => `/email/${encodeURIComponent(String(email || "").trim())}`,
      providesTags: ["Orders"],
    }),

    /* ---------------- ADMIN ---------------- */

    getAllOrders: builder.query({
      query: () => "/",
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map((o) => ({ type: "Order", id: o?._id })),
              { type: "Orders", id: "LIST" },
            ]
          : [{ type: "Orders", id: "LIST" }],
      keepUnusedDataFor: 5,
    }),

    getOrderById: builder.query({
      query: (mongoId) => `/${encodeURIComponent(String(mongoId || "").trim())}`,
      providesTags: (_res, _err, mongoId) => [{ type: "Order", id: mongoId }],
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
      invalidatesTags: (_res, _err, arg) => [
        { type: "Order", id: arg?.orderId },
        { type: "Orders", id: "LIST" },
      ],
    }),

    deleteOrder: builder.mutation({
      query: (orderId) => ({
        url: `/${encodeURIComponent(String(orderId || "").trim())}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Orders"],
    }),

    /* ---------------- OPTIONAL ---------------- */

    removeProductFromOrder: builder.mutation({
      query: (payload) => ({
        url: "/remove-product",
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Orders"],
    }),

    sendOrderNotification: builder.mutation({
      query: (payload) => ({
        url: "/notify",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Orders"],
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