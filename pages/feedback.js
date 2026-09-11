import SubmissionPage from "../components/submissions/SubmissionPage";
import { SUBMISSION_TYPES } from "../data/submission-types";
import styles from "../styles/submission-page.module.css";

const type = SUBMISSION_TYPES.site_feedback;

export default function FeedbackPage() {
  return (
    <SubmissionPage type={type}>
      <section className={styles.section}>
        <h2>What helps most</h2>
        <p>
          Mentions of the page you were on, the device you used, and what you
          expected make feedback easier to act on. Attachments are not accepted
          yet.
        </p>
      </section>
    </SubmissionPage>
  );
}
