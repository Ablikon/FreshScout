import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home/Home';
import Category from '../pages/Category/Category';
import Product from '../pages/Product/Product';
import Cart from '../pages/Cart/Cart';
import Search from '../pages/Search/Search';
import Favorites from '../pages/Favorites/Favorites';
import Login from '../pages/Login/Login';
import NotFound from '../pages/NotFound/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="category/:slug" element={<Category />} />
        <Route path="product/:id" element={<Product />} />
        <Route path="cart" element={<Cart />} />
        <Route path="search" element={<Search />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
