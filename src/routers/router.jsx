// src/routers/router.jsx
import { createBrowserRouter } from "react-router-dom";

import App from "../App";

// ----- Public pages -----
import Home from "../pages/home/Home.jsx";
import ProductsPage from "../pages/Products.jsx";
import AboutPage from "../pages/About.jsx";
import ContactPage from "../pages/Contact.jsx";

// ----- Cart + Checkout (PUBLIC / Guest COD) -----
import CartPage from "../pages/products/CartPage";
import CheckoutPage from "../pages/products/CheckoutPage.jsx"; // ✅ make sure path matches your file location
import SingleProduct from "../pages/products/SingleProduct.jsx";

// ----- Order pages (PUBLIC) -----
import OrderConfirm from "../pages/OrderConfirm.jsx";
import OrderSuccess from "../pages/OrderSuccess.jsx";
import OrderTrack from "../pages/OrderTrack.jsx";

// ----- Admin guards -----
import AdminRoute from "./AdminRoute";

// ----- Admin login -----
import AdminLogin from "./../components/AdminLogin";

// ----- Admin dashboard pages -----
import DashboardLayout from "../pages/dashboard/DashboardLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import ManageProducts from "../pages/dashboard/manageProducts/ManageProducts";
import AddProduct from "../pages/dashboard/addProduct/AddProduct";
import UpdateProduct from "../pages/dashboard/EditProduct/UpdateProduct";
import ManageOrders from "../pages/dashboard/manageOrders/manageOrder";
import AddOrder from "../pages/dashboard/addOrder/addOrder.jsx";
import UpdateOrder from "../pages/dashboard/EditOrder/UpdateOrder.jsx";

// -----------------------------------------------------------------------------
// Router Definition
// -----------------------------------------------------------------------------
const router = createBrowserRouter([
  // ---------------------------------------------------------------------------
  // Public Routes (wrapped with <App/> layout)
  // ---------------------------------------------------------------------------
  {
    path: "/",
    element: <App />,
    children: [
      // Public pages
      { path: "/", element: <Home /> },
      { path: "/products", element: <ProductsPage /> },
      { path: "/about", element: <div><AboutPage /></div> },
      { path: "/contact", element: <ContactPage /> },

      // Cart + Checkout (PUBLIC ✅)
      { path: "/cart", element: <CartPage /> },
      { path: "/checkout", element: <CheckoutPage /> },

      // Order flow (PUBLIC ✅)
      { path: "/order-confirm/:orderId", element: <OrderConfirm /> },
      { path: "/order-success/:orderId", element: <OrderSuccess /> },
      { path: "/order-track", element: <OrderTrack /> },
      { path: "/order-track/:orderId", element: <OrderTrack /> },

      // Single Product
      { path: "/products/:id", element: <SingleProduct /> },
    ],
  },

  // ---------------------------------------------------------------------------
  // Admin Routes
  // ---------------------------------------------------------------------------

  // Admin login (public)
  {
    path: "/admin",
    element: <AdminLogin />,
  },

  // Admin dashboard (protected via AdminRoute)
  {
    path: "/dashboard",
    element: (
      <AdminRoute>
        <DashboardLayout />
      </AdminRoute>
    ),
    children: [
      // Dashboard home
      {
        path: "",
        element: (
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        ),
      },

      // Products management
      {
        path: "add-new-product",
        element: (
          <AdminRoute>
            <AddProduct />
          </AdminRoute>
        ),
      },
      {
        path: "edit-product/:id",
        element: (
          <AdminRoute>
            <UpdateProduct />
          </AdminRoute>
        ),
      },
      {
        path: "manage-products",
        element: (
          <AdminRoute>
            <ManageProducts />
          </AdminRoute>
        ),
      },

      // Orders management
      {
        path: "manage-orders",
        element: (
          <AdminRoute>
            <ManageOrders />
          </AdminRoute>
        ),
      },
      {
        path: "add-order",
        element: (
          <AdminRoute>
            <AddOrder />
          </AdminRoute>
        ),
      },
      {
        path: "edit-order/:id",
        element: (
          <AdminRoute>
            <UpdateOrder />
          </AdminRoute>
        ),
      },
    ],
  },
]);

export default router;