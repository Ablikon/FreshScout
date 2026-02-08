import Catalog from "../pages/Catalog/Catalog.jsx";
import Checkout from "../pages/Checkout/Checkout.jsx";
import Orders from "../pages/Orders/Orders.jsx";
import Favorites from "../pages/Favorites/Favorites.jsx";
import LoginPage from "../pages/Login/LoginPage.jsx";

export const routes = [
  { path: "/", element: <Catalog /> },
  { path: "/checkout", element: <Checkout /> },
  { path: "/orders", element: <Orders /> },
  { path: "/favorites", element: <Favorites /> },
  { path: "/login", element: <LoginPage /> },
];
