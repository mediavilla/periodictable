import Head from "next/head";
import ExplorerNavigation from "./ExplorerNavigation";
import FooterViewport from "./FooterViewport";
import styles from "../../styles/placeholder-page.module.css";

export default function PlaceholderPage({ title, description }) {
  return (
    <>
      <Head>
        <title>{title} · Explore the periodic table</title>
        <meta name="description" content={description} />
      </Head>
      <main className={`explorerPage ${styles.page}`}>
        <ExplorerNavigation />
        <article className={styles.content}>
          <span className="explorerEyebrow">Coming soon</span>
          <h1>{title}</h1>
          <p className={styles.description}>{description}</p>
          <div className={styles.note}>
            <h2>A little more to come.</h2>
            <p>
              This page is a placeholder. We’ll add more information here soon.
            </p>
          </div>
        </article>
      </main>
      <FooterViewport />
    </>
  );
}
