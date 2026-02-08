import { Outlet } from 'react-router-dom';
import Header from '../components/Header/Header';
import CategoryBar from '../components/CategoryBar/CategoryBar';
import CartDrawer from '../components/CartDrawer/CartDrawer';
import SearchModal from '../components/SearchModal/SearchModal';
import s from './MainLayout.module.css';

export default function MainLayout() {
  return (
    <div className={s.layout}>
      <Header />
      <CategoryBar />
      <main className={s.main}>
        <Outlet />
      </main>
      <CartDrawer />
      <SearchModal />
    </div>
  );
}
