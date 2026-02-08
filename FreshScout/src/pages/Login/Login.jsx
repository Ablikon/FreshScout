import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp, verifyOtp as verifyOtpApi } from '../../api';
import Icon from '../../components/Icon/Icon';
import s from './Login.module.css';

export default function LoginPage() {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('+7');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length < 12) {
      setError('Введите корректный номер');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendOtp(phone);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length < 4) {
      setError('Введите 4-значный код');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await verifyOtpApi(phone, code);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.logo}><Icon name="cart" size={48} /></div>
        <h1 className={s.title}>FreshScout</h1>
        <p className={s.subtitle}>Войдите, чтобы сохранять заказы</p>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className={s.form}>
            <input
              className={s.input}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (___) ___-__-__"
              autoFocus
            />
            {error && <p className={s.error}>{error}</p>}
            <button className={s.btn} type="submit" disabled={loading}>
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className={s.form}>
            <p className={s.hint}>Код отправлен на {phone}</p>
            <input
              className={s.input}
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Введите код"
              maxLength={4}
              autoFocus
            />
            {error && <p className={s.error}>{error}</p>}
            <button className={s.btn} type="submit" disabled={loading}>
              {loading ? 'Проверка...' : 'Войти'}
            </button>
            <button type="button" className={s.backBtn} onClick={() => { setStep('phone'); setError(''); }}>
              Изменить номер
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
