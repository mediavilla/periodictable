import SubmissionPage from "../components/submissions/SubmissionPage";
import { ROADMAP_ITEMS } from "../data/submission-content";
import { SUBMISSION_TYPES } from "../data/submission-types";
import styles from "../styles/submission-page.module.css";

const type = SUBMISSION_TYPES.roadmap_suggestion;

export default function RoadmapPage() {
  return (
    <SubmissionPage type={type}>
      <section className={styles.section}>
        <h2>Current direction</h2>
        <p>
          This is a living sketch of priorities. Suggest what would help you
          most and it will enter the private review queue.
        </p>
      </section>
      {ROADMAP_ITEMS.map((item) => (
        <section key={item.title} className={styles.item}>
          <span className={styles.status}>{item.status}</span>
          <h3>{item.title}</h3>
          <p>{item.detail}</p>
        </section>
      ))}
    </SubmissionPage>
  );
}
