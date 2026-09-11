import SubmissionPage from "../components/submissions/SubmissionPage";
import { FAQ_ENTRIES } from "../data/submission-content";
import { SUBMISSION_TYPES } from "../data/submission-types";
import styles from "../styles/submission-page.module.css";

const type = SUBMISSION_TYPES.faq_question;

export default function FaqPage() {
  return (
    <SubmissionPage type={type}>
      <section className={styles.section}>
        <h2>Common questions</h2>
        <p>
          Start here. If your question is not covered, send it with the form
          below.
        </p>
      </section>
      {FAQ_ENTRIES.map((entry) => (
        <section key={entry.question} className={styles.faqItem}>
          <h2>{entry.question}</h2>
          <p>{entry.answer}</p>
        </section>
      ))}
    </SubmissionPage>
  );
}
