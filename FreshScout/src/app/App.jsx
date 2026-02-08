import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout/MainLayout.jsx";

import Catalog from "../pages/Catalog/Catalog.jsx";
import Checkout from "../pages/Checkout/Checkout.jsx";
import Orders from "../pages/Orders/Orders.jsx";
import Favorites from "../pages/Favorites/Favorites.jsx";
import LoginPage from "../pages/Login/LoginPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/*"
        element={
          <MainLayout>
            <Routes>
              <Route path="/" element={<Catalog />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/favorites" element={<Favorites />} />
            </Routes>
          </MainLayout>
        }
      />
    </Routes>
  );
}
