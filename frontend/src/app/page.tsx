import ThemeToggle from '@/components/ThemeToggle';
import CSVImporter from '@/components/CSVImporter';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      {/* Decorative Aurora Blobs for Premium Glassmorphism Look */}
      <div className={styles.auroraContainer}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
        <div className={styles.blob3}></div>
      </div>

      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.logoContainer}>
            <div className={styles.logoText}>
              Grow<span>Easy</span>
            </div>
            <span className={styles.logoBadge}>AI CSV Importer</span>
          </div>
          <ThemeToggle />
        </div>
      </header>
      
      <main className={styles.main}>
        <CSVImporter />
      </main>

      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
