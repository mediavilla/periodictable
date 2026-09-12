import Head from "next/head";
import Link from "next/link";
import ExplorerNavigation from "../explorer/ExplorerNavigation";
import FooterViewport from "../explorer/FooterViewport";
import SubmissionForm from "./SubmissionForm";
import pageStyles from "../../styles/placeholder-page.module.css";
import styles from "../../styles/submission-page.module.css";

export default function SubmissionPage({
  type,
  children,
  showForm = true,
  formSectionClassName,
}) {
  return (
    <>
      <Head>
        <title>{type.title} · Explore the periodic table</title>
        <meta name="description" content={type.description} />
      </Head>
      <main className={`explorerPage ${pageStyles.page}`}>
        <ExplorerNavigation />
        <article className={pageStyles.content}>
          <span className="explorerEyebrow">{type.eyebrow}</span>
          <h1>{type.title}</h1>
          <p className={pageStyles.description}>{type.description}</p>

          {children ? <div className={styles.sections}>{children}</div> : null}

          {showForm ? (
            <section
              className={[styles.formSection, formSectionClassName]
                .filter(Boolean)
                .join(" ")}
              aria-label={type.formTitle}
            >
              <SubmissionForm type={type} />
            </section>
          ) : null}

          <nav className={styles.related} aria-label="Related contribution pages">
            {type.links.map((link) => (
              <Link key={link.href} href={link.href} className={styles.relatedLink}>
                {link.label}
              </Link>
            ))}
          </nav>
        </article>
      </main>
          <FooterViewport />
    </>
  );
}
