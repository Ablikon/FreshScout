import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LoginPage.module.css";
import Button from "../../components/Ui/Button.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import {
  requestCode as apiRequestCode,
  verifyCode as apiVerifyCode,
} from "../../api/auth";

function normalizePhone(raw) {
  let s = String(raw || "")
    .trim()
    .replace(/\s+/g, "");
  if (/^8\d{10}$/.test(s)) s = "+7" + s.slice(1);
  return s;
}
function isValidPhone(p) {
  return /^\+7\d{10}$/.test(p);
}

export default function LoginPage() {
  const nav = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    if (auth.isAuthed) nav("/", { replace: true });
  }, [auth.isAuthed, nav]);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", code: "" });

  const phoneNorm = useMemo(() => normalizePhone(form.phone), [form.phone]);
  const phoneOk = isValidPhone(phoneNorm);

  async function requestCode() {
    setHint("");
    if (!form.name.trim()) return setHint("Введите имя");
    if (!phoneOk) return setHint("Введите номер: +77071234567 или 87071234567");

    setLoading(true);
    try {
      const data = await apiRequestCode(phoneNorm);
      if (data.devCode) setHint(`DEV код: ${data.devCode}`);
      setStep(2);
    } catch (e) {
      setHint(e?.response?.data?.message || "Не удалось отправить код");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setHint("");
    if (!form.code.trim()) return setHint("Введите код");

    setLoading(true);
    try {
      const data = await apiVerifyCode(
        phoneNorm,
        form.code.trim(),
        form.name.trim(),
      );
      auth.signIn(data.token, data.user);
      nav("/", { replace: true });
    } catch (e) {
      setHint(e?.response?.data?.message || "Неверный код");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => nav(-1)}>
        ← Назад
      </button>

      <div className={styles.card}>
        <div className={styles.welcome}>
          <div className={styles.hello}>Добро пожаловать 👋</div>
          <div className={styles.desc}>
            Войдите по номеру телефона — мы отправим SMS-код для подтверждения.
          </div>
        </div>

        {step === 1 ? (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Ваше имя</label>
              <input
                className={styles.input}
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Например: Арафат"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Номер телефона</label>
              <input
                className={styles.input}
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+77071234567 или 87071234567"
              />
            </div>

            {hint && <div className={styles.hint}>{hint}</div>}

            <Button onClick={requestCode} disabled={loading}>
              {loading ? "Отправляем..." : "Получить код"}
            </Button>
          </>
        ) : (
          <>
            <div className={styles.rowBetween}>
              <div className={styles.helper}>
                Номер: <b>{phoneNorm}</b>
              </div>
              <button className={styles.link} onClick={() => setStep(1)}>
                Изменить
              </button>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Код из SMS</label>
              <input
                className={styles.input}
                value={form.code}
                onChange={(e) =>
                  setForm((p) => ({ ...p, code: e.target.value }))
                }
                placeholder="4 цифры"
              />
              <div className={styles.helper}>
                Пока что код выводим в подсказке.
              </div>
            </div>

            {hint && <div className={styles.hint}>{hint}</div>}

            <Button onClick={verifyCode} disabled={loading}>
              {loading ? "Проверяем..." : "Войти"}
            </Button>
          </>
        )}

        <div className={styles.privacy}>
          Нажимая «Войти», вы соглашаетесь с{" "}
          <span>политикой конфиденциальности</span> и{" "}
          <span>условиями использования</span>. Мы не передаём номер телефона
          третьим лицам.
        </div>
      </div>
    </div>
  );
}
