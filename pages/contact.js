import SubmissionPage from "../components/submissions/SubmissionPage";
import { SUBMISSION_TYPES } from "../data/submission-types";
import styles from "../styles/submission-page.module.css";

const type = SUBMISSION_TYPES.contact_message;

export default function ContactPage() {
  return (
    <SubmissionPage
      type={type}
      formSectionClassName={styles.sectionHalf}
    />
  );
}
