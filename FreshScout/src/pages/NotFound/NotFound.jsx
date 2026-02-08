import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import s from './NotFound.module.css';

export default function NotFound() {
  return (
    <div className={s.page}>
      <div className={s.content}>
        <Icon name="search" size={56} style={{ opacity: 0.3 }} />
        <h1 className={s.code}>404</h1>
        <p className={s.text}>Страница не найдена</p>
        <Link to="/" className={s.link}>Вернуться на главную</Link>
      </div>
    </div>
  );
}
