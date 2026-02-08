import styles from "./MainLayout.module.css";
import Header from "../../components/Header/Header.jsx";
import Sidebar from "../../components/Sidebar/Sidebar.jsx";

export default function MainLayout({ children }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
